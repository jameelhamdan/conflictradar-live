"""RQ job entrypoints for the ingestion and aggregation pipeline."""

import os
from datetime import datetime, timedelta, timezone as dt_timezone

from django_rq import job
from services.workflow import Workflow

JOB_TIMEOUT_SECONDS = int(os.getenv("JOB_TIMEOUT_SECONDS", "1800"))
DEFAULT_FETCH_HOURS = int(os.getenv("FETCH_LOOKBACK_HOURS", "1"))
DEFAULT_PROCESS_LIMIT = int(os.getenv("PROCESS_LIMIT", "1000"))
DEFAULT_AGGREGATE_HOURS = int(os.getenv("AGGREGATE_HOURS", "24"))
DEFAULT_AGGREGATE_MIN_ARTICLES = int(os.getenv("AGGREGATE_MIN_ARTICLES", "1"))


# ── Text pipeline ─────────────────────────────────────────────────────────────

@job("default", timeout=JOB_TIMEOUT_SECONDS)
def fetch_articles_job(source_code: str | None, start_date: datetime) -> int:
    return Workflow.fetch_articles(source_code, start_date)


def enqueue_fetch_all_sources(fetch_hours: int = DEFAULT_FETCH_HOURS) -> None:
    start_date = datetime.now(dt_timezone.utc) - timedelta(hours=fetch_hours)
    fetch_articles_job.delay(source_code=None, start_date=start_date)


@job("default", timeout=JOB_TIMEOUT_SECONDS)
def process_articles_job(
    limit: int = DEFAULT_PROCESS_LIMIT,
    source_code: str | None = None,
    reprocess: bool = False,
) -> int:
    return Workflow.process_articles(limit=limit, source_code=source_code, reprocess=reprocess)


def enqueue_process_articles(limit: int = DEFAULT_PROCESS_LIMIT) -> None:
    # was calling Workflow.process_articles() directly — ran synchronously in scheduler thread
    process_articles_job.delay(limit=limit)


@job("default", timeout=JOB_TIMEOUT_SECONDS)
def aggregate_events_job(
    hours: int = DEFAULT_AGGREGATE_HOURS,
    min_articles: int = DEFAULT_AGGREGATE_MIN_ARTICLES,
) -> tuple[int, int]:
    return Workflow.aggregate_events(hours=hours, min_articles=min_articles)


def enqueue_aggregate_events(
    hours: int = DEFAULT_AGGREGATE_HOURS,
    min_articles: int = DEFAULT_AGGREGATE_MIN_ARTICLES,
) -> None:
    # was calling Workflow.aggregate_events() directly — ran synchronously in scheduler thread
    aggregate_events_job.delay(hours=hours, min_articles=min_articles)


# ── Stream jobs ───────────────────────────────────────────────────────────────
# Call run_stream directly — no Workflow indirection needed for these.

@job("default", timeout=JOB_TIMEOUT_SECONDS)
def fetch_prices_job() -> int:
    from services.streams import run_stream
    return run_stream('prices')


@job("default", timeout=JOB_TIMEOUT_SECONDS)
def fetch_notams_job() -> int:
    from services.streams import run_stream
    return run_stream('notam')


@job("default", timeout=JOB_TIMEOUT_SECONDS)
def fetch_earthquakes_job() -> int:
    from services.streams import run_stream
    return run_stream('earthquakes')


@job("default", timeout=JOB_TIMEOUT_SECONDS)
def fetch_forex_job() -> int:
    from services.streams import run_stream
    return run_stream('forex')
