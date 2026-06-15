"""Task functions for the ingestion and aggregation pipeline.

These are plain Python functions enqueued via django-rq (services.queue.enqueue).
"""

import os
from datetime import datetime, timedelta, timezone as dt_timezone

from services.workflow import Workflow

JOB_TIMEOUT_SECONDS = int(os.getenv("JOB_TIMEOUT_SECONDS", "1800"))
DEFAULT_FETCH_MINUTES = int(os.getenv("FETCH_INTERVAL_MINUTES", "10")) * 2
DEFAULT_PROCESS_LIMIT = int(os.getenv("PROCESS_LIMIT", "1000"))
DEFAULT_AGGREGATE_HOURS = int(os.getenv("AGGREGATE_HOURS", "24"))
DEFAULT_AGGREGATE_MIN_ARTICLES = int(os.getenv("AGGREGATE_MIN_ARTICLES", "1"))


# ── Text pipeline ─────────────────────────────────────────────────────────────

def fetch_articles_task(source_code: str | None = None, start_date: datetime | None = None) -> int:
    now = datetime.now(dt_timezone.utc)
    if start_date is None:
        start_date = now - timedelta(minutes=DEFAULT_FETCH_MINUTES)
    # Soft deadline 30 s before the hard RQ timeout fires (interval - 60 s).
    # Checked between sources so we stop gracefully rather than being force-killed mid-fetch.
    interval_seconds = int(os.getenv('FETCH_INTERVAL_MINUTES', '10')) * 60
    deadline = now + timedelta(seconds=interval_seconds - 30)
    return Workflow.fetch_articles(source_code, start_date, deadline=deadline)


def process_articles_task(
    limit: int = DEFAULT_PROCESS_LIMIT,
    source_code: str | None = None,
    reprocess: bool = False,
) -> int:
    return Workflow.process_articles(limit=limit, source_code=source_code, reprocess=reprocess)


def aggregate_events_task(
    hours: int = DEFAULT_AGGREGATE_HOURS,
    min_articles: int = DEFAULT_AGGREGATE_MIN_ARTICLES,
) -> tuple[int, int]:
    return Workflow.aggregate_events(hours=hours, min_articles=min_articles)


# ── Topic tasks ────────────────────────────────────────────────────────────────

def refresh_topics_task() -> int:
    return Workflow.refresh_topics()


def tag_topics_task(hours: int = DEFAULT_AGGREGATE_HOURS, force_retag: bool = False) -> int:
    return Workflow.tag_events_with_topics(hours=hours, force_retag=force_retag)


def retroactive_tag_topic_task(slug: str, lookback_hours: int = 72) -> int:
    return Workflow.retroactive_tag_topic(slug=slug, lookback_hours=lookback_hours)


def discover_topics_task(hours: int = 6) -> int:
    return Workflow.discover_topics_from_events(hours=hours)


# ── Stream tasks ───────────────────────────────────────────────────────────────

def fetch_prices_task() -> int:
    from services.streams import run_stream
    return run_stream('prices')


def fetch_notams_task() -> int:
    from services.streams import run_stream
    return run_stream('notam')


def fetch_earthquakes_task() -> int:
    from services.streams import run_stream
    return run_stream('earthquakes')


def fetch_forex_task() -> int:
    from services.streams import run_stream
    return run_stream('forex')


# ── Forecasting tasks ──────────────────────────────────────────────────────────
# All three entrypoints short-circuit when the subsystem is switched off via
# FORECASTING_ENABLED, so manual/admin triggers honour the flag too — not just the
# scheduler. The gate lives in services.forecasting (single source of truth).

def run_forecast_task() -> int:
    from services.forecasting import is_enabled
    if not is_enabled():
        return 0
    from services.forecasting.service import run_forecasts
    return run_forecasts()


def score_forecasts_task() -> int:
    from services.forecasting import is_enabled
    if not is_enabled():
        return 0
    from services.forecasting.service import score_forecasts
    return score_forecasts()


def train_forecaster_task() -> dict:
    """Train the v2 quantitative classifier per (symbol, horizon). Heavy queue.

    Degrades gracefully — returns an error marker if lightgbm/numpy are absent so
    the v1 LLM remains the operative predictor.
    """
    from services.forecasting import is_enabled
    if not is_enabled():
        return {'disabled': True}
    from services.forecasting.model import train
    from services.forecasting.service import DEFAULT_SYMBOLS, _horizons_for

    results: dict = {}
    for symbol, stream_key in DEFAULT_SYMBOLS:
        for _label, hours in _horizons_for(stream_key):
            try:
                results[f'{symbol}|{hours}h'] = train(symbol, hours)
            except RuntimeError as exc:
                return {'error': str(exc)}
            except Exception as exc:  # noqa: BLE001
                results[f'{symbol}|{hours}h'] = {'error': str(exc)}
    return results


# ── Backfill tasks ─────────────────────────────────────────────────────────────

def backfill_history_task(
    source_code: str,
    start_date: datetime,
    end_date: datetime,
    top_n: int = 10,
    delay_seconds: float = 0.5,
    dry_run: bool = False,
    resume: bool = False,
    progress=None,
) -> dict:
    """
    Backfill top-N articles per ISO week for a source.

    Enqueue with job_timeout=-1 (no cap) since multi-year backtracks can take
    longer than the standard 30-minute task timeout.

    ``start_date`` / ``end_date`` accept either ``datetime`` objects or
    ``YYYY-MM-DD`` strings (the latter so the task is trivially enqueueable).
    ``resume`` skips ISO weeks already recorded in the Django cache checkpoint;
    ``progress`` is an optional ``callable(WeekResult)`` invoked per week (the
    management command passes one to echo per-week lines to stdout).

    Returns {'weeks': int, 'fetched': int, 'saved': int}.
    """
    import logging

    import core.models as m
    from django.core.cache import cache
    from services.data.historical import HistoricalBackfillService

    logger = logging.getLogger(__name__)

    start_date = _parse_backfill_date(start_date)
    end_date = _parse_backfill_date(end_date)

    source = m.Source.objects.get(code=source_code)
    service = HistoricalBackfillService(
        source=source,
        start_date=start_date,
        end_date=end_date,
        top_n=top_n,
        delay_seconds=delay_seconds,
    )

    checkpoint_key = f'backfill:{source_code}:{start_date.date()}:{end_date.date()}:done'
    resume_weeks: set[str] = (cache.get(checkpoint_key) or set()) if resume else set()

    total_weeks = total_fetched = total_saved = 0
    for result in service.run(resume_weeks=resume_weeks, dry_run=dry_run):
        total_weeks += 1
        total_fetched += result.fetched
        total_saved += result.saved
        if progress is not None:
            progress(result)
        if resume and not dry_run:
            resume_weeks.add(result.week_start.isoformat())
            cache.set(checkpoint_key, resume_weeks, timeout=None)

    summary = {'weeks': total_weeks, 'fetched': total_fetched, 'saved': total_saved}
    logger.info('backfill_history_task %s done: %s', source_code, summary)
    return summary


def backfill_all_sources_task(
    start_date: datetime,
    end_date: datetime,
    top_n: int = 10,
    delay_seconds: float = 0.5,
    dry_run: bool = False,
    resume: bool = False,
    progress=None,
    on_source_start=None,
) -> dict:
    """
    Backfill every enabled RSS source over the same date range, sequentially.

    Only ``SourceType.RSS`` sources are eligible (the historical backfill has no
    strategy for other types); disabled sources are skipped. Running sources one
    at a time keeps API rate-limit pressure bounded. ``on_source_start`` is an
    optional ``callable(Source)`` invoked before each source; ``progress`` is
    forwarded per week to :func:`backfill_history_task`.

    Enqueue with job_timeout=-1 — backfilling many sources can run for hours.

    Returns {'sources': int, 'weeks': int, 'fetched': int, 'saved': int,
             'per_source': {code: {weeks, fetched, saved}}}.
    """
    import logging

    import core.models as m

    logger = logging.getLogger(__name__)

    start_date = _parse_backfill_date(start_date)
    end_date = _parse_backfill_date(end_date)

    sources = list(
        m.Source.objects.filter(type=m.SourceType.RSS, is_enabled=True).order_by('code')
    )

    totals = {'sources': 0, 'weeks': 0, 'fetched': 0, 'saved': 0, 'per_source': {}}
    for source in sources:
        if on_source_start is not None:
            on_source_start(source)
        summary = backfill_history_task(
            source.code, start_date, end_date,
            top_n=top_n, delay_seconds=delay_seconds, dry_run=dry_run, resume=resume,
            progress=progress,
        )
        totals['per_source'][source.code] = summary
        totals['sources'] += 1
        for key in ('weeks', 'fetched', 'saved'):
            totals[key] += summary[key]

    logger.info(
        'backfill_all_sources_task done: %s source(s), %s saved',
        totals['sources'], totals['saved'],
    )
    return totals


def _parse_backfill_date(value) -> datetime:
    """Normalize a backfill bound to a UTC datetime (accepts YYYY-MM-DD strings)."""
    if isinstance(value, datetime):
        return value
    d = datetime.strptime(value, '%Y-%m-%d')
    return d.replace(tzinfo=dt_timezone.utc)
