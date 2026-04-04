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

def run_forecast_task() -> int:
    from services.forecasting.service import run_forecasts
    return run_forecasts()


def score_forecasts_task() -> int:
    from services.forecasting.service import score_forecasts
    return score_forecasts()


# ── Maintenance tasks ──────────────────────────────────────────────────────────

def purge_articles_task() -> int:
    """
    Two-phase article cleanup for aggregated articles:

    Phase 1 (ARTICLE_ARCHIVE_HOURS, default 48h): Clear heavy fields (content,
    entities) on aggregated articles to free storage while keeping metadata
    (title, source_url, published_on, etc.) for EventDetailView and newsletter.

    Phase 2 (ARTICLE_RETENTION_HOURS, default 168h / 7 days): Hard-delete the
    now-metadata-only articles.

    Returns the total number of articles affected (archived + deleted).
    """
    import logging as _logging
    import uuid as _uuid

    from django.utils import timezone

    from core.models import Article, Event

    _log = _logging.getLogger(__name__)
    archive_hours = int(os.getenv('ARTICLE_ARCHIVE_HOURS', '48'))
    retention_hours = int(os.getenv('ARTICLE_RETENTION_HOURS', '168'))
    now = timezone.now()
    archive_cutoff = now - timedelta(hours=archive_hours)
    retention_cutoff = now - timedelta(hours=retention_hours)
    window_start = now - timedelta(days=30)

    aggregated_ids: set[str] = set()
    for event in Event.objects.filter(started_at__gte=window_start).only('article_ids'):
        for aid in (event.article_ids or []):
            aggregated_ids.add(str(aid))

    if not aggregated_ids:
        return 0

    uuids = []
    for raw in aggregated_ids:
        try:
            uuids.append(_uuid.UUID(raw))
        except (ValueError, AttributeError):
            pass

    # Phase 1: Clear content + entities on articles older than archive_hours
    archived = Article.objects.filter(
        id__in=uuids,
        published_on__lt=archive_cutoff,
    ).update(content='', entities=[])
    if archived:
        _log.info('[purge] Archived (cleared content) %d article(s) older than %dh', archived, archive_hours)

    # Phase 2: Hard-delete articles older than retention_hours
    deleted, _ = Article.objects.filter(
        id__in=uuids,
        published_on__lt=retention_cutoff,
    ).delete()
    if deleted:
        _log.info('[purge] Deleted %d article(s) older than %dh', deleted, retention_hours)

    return archived + deleted
