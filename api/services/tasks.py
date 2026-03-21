"""Celery task entrypoints for the ingestion and aggregation pipeline."""

import os
from datetime import datetime, timedelta, timezone as dt_timezone

from celery import shared_task

from services.workflow import Workflow

JOB_TIMEOUT_SECONDS = int(os.getenv("JOB_TIMEOUT_SECONDS", "1800"))
DEFAULT_FETCH_HOURS = int(os.getenv("FETCH_LOOKBACK_HOURS", "1"))
DEFAULT_PROCESS_LIMIT = int(os.getenv("PROCESS_LIMIT", "1000"))
DEFAULT_AGGREGATE_HOURS = int(os.getenv("AGGREGATE_HOURS", "24"))
DEFAULT_AGGREGATE_MIN_ARTICLES = int(os.getenv("AGGREGATE_MIN_ARTICLES", "1"))


# ── Text pipeline ─────────────────────────────────────────────────────────────

@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=2, default_retry_delay=60)
def fetch_articles_task(source_code: str | None = None, start_date: datetime | None = None) -> int:
    if start_date is None:
        start_date = datetime.now(dt_timezone.utc) - timedelta(hours=DEFAULT_FETCH_HOURS)
    return Workflow.fetch_articles(source_code, start_date)


def enqueue_fetch_all_sources(fetch_hours: int = DEFAULT_FETCH_HOURS) -> None:
    start_date = datetime.now(dt_timezone.utc) - timedelta(hours=fetch_hours)
    fetch_articles_task.delay(source_code=None, start_date=start_date)


@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=2, default_retry_delay=60)
def process_articles_task(
    limit: int = DEFAULT_PROCESS_LIMIT,
    source_code: str | None = None,
    reprocess: bool = False,
) -> int:
    return Workflow.process_articles(limit=limit, source_code=source_code, reprocess=reprocess)


def enqueue_process_articles(limit: int = DEFAULT_PROCESS_LIMIT) -> None:
    process_articles_task.delay(limit=limit)


@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=2, default_retry_delay=60)
def aggregate_events_task(
    hours: int = DEFAULT_AGGREGATE_HOURS,
    min_articles: int = DEFAULT_AGGREGATE_MIN_ARTICLES,
) -> tuple[int, int]:
    return Workflow.aggregate_events(hours=hours, min_articles=min_articles)


def enqueue_aggregate_events(
    hours: int = DEFAULT_AGGREGATE_HOURS,
    min_articles: int = DEFAULT_AGGREGATE_MIN_ARTICLES,
) -> None:
    aggregate_events_task.delay(hours=hours, min_articles=min_articles)


# ── Topic tasks ────────────────────────────────────────────────────────────────

@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=2, default_retry_delay=60)
def refresh_topics_task() -> int:
    return Workflow.refresh_topics()


def enqueue_refresh_topics() -> None:
    refresh_topics_task.delay()


@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=2, default_retry_delay=60)
def tag_topics_task(hours: int = DEFAULT_AGGREGATE_HOURS, force_retag: bool = False) -> int:
    return Workflow.tag_events_with_topics(hours=hours, force_retag=force_retag)


def enqueue_tag_topics(hours: int = DEFAULT_AGGREGATE_HOURS) -> None:
    tag_topics_task.delay(hours=hours)


@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=2, default_retry_delay=60)
def retroactive_tag_topic_task(slug: str, lookback_hours: int = 72) -> int:
    return Workflow.retroactive_tag_topic(slug=slug, lookback_hours=lookback_hours)


@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=1, default_retry_delay=120)
def discover_topics_task(hours: int = 6) -> int:
    return Workflow.discover_topics_from_events(hours=hours)


# ── Stream tasks ───────────────────────────────────────────────────────────────

@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=2, default_retry_delay=60)
def fetch_prices_task() -> int:
    from services.streams import run_stream
    return run_stream('prices')


@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=2, default_retry_delay=60)
def fetch_notams_task() -> int:
    from services.streams import run_stream
    return run_stream('notam')


@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=2, default_retry_delay=60)
def fetch_earthquakes_task() -> int:
    from services.streams import run_stream
    return run_stream('earthquakes')


@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=2, default_retry_delay=60)
def fetch_forex_task() -> int:
    from services.streams import run_stream
    return run_stream('forex')


# ── Forecasting tasks ──────────────────────────────────────────────────────────

@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=2, default_retry_delay=60)
def run_forecast_task() -> int:
    from services.forecasting.service import run_forecasts
    return run_forecasts()


@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=2, default_retry_delay=60)
def score_forecasts_task() -> int:
    from services.forecasting.service import score_forecasts
    return score_forecasts()
