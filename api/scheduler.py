#!/usr/bin/env python
"""Dedicated periodic scheduler for the pipeline."""

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings.base")

import django
from django_rq.cron import DjangoCronScheduler
from rq.logutils import setup_loghandlers


def run_scheduler() -> None:
    print('Starting Scheduler...')
    setup_loghandlers("INFO")
    django.setup()

    from services.tasks import (
        enqueue_fetch_all_sources,
        enqueue_process_articles,
        enqueue_aggregate_events,
        fetch_prices_job,
        fetch_notams_job,
        fetch_earthquakes_job,
        fetch_forex_job,
    )
    from newsletter.tasks import enqueue_generate_newsletter, enqueue_send_newsletter

    fetch_interval      = int(os.getenv("FETCH_INTERVAL_MINUTES", "10"))
    process_interval    = int(os.getenv("PROCESS_INTERVAL_MINUTES", "10"))
    aggregate_interval  = int(os.getenv("AGGREGATE_INTERVAL_MINUTES", "10"))
    price_interval      = int(os.getenv("PRICE_FETCH_INTERVAL_MINUTES", "5"))
    notam_interval      = int(os.getenv("NOTAM_FETCH_INTERVAL_MINUTES", "15"))
    earthquake_interval = int(os.getenv("EARTHQUAKE_FETCH_INTERVAL_MINUTES", "5"))
    forex_interval      = int(os.getenv("FOREX_FETCH_INTERVAL_MINUTES", "15"))

    # Newsletter: run once per day at configured UTC hours (converted to minutes-from-midnight)
    newsletter_generate_hour = int(os.getenv("NEWSLETTER_GENERATE_HOUR", "6"))
    newsletter_send_hour     = int(os.getenv("NEWSLETTER_SEND_HOUR", "7"))

    scheduler = DjangoCronScheduler(logging_level="INFO")

    def reg(fn, interval_minutes: int) -> None:
        scheduler.register(fn, queue_name="default", kwargs={},
                           interval=max(1, interval_minutes) * 60, job_timeout=300)

    reg(enqueue_fetch_all_sources, fetch_interval)
    reg(enqueue_process_articles,  process_interval)
    reg(enqueue_aggregate_events,  aggregate_interval)
    reg(fetch_prices_job.delay,    price_interval)
    reg(fetch_notams_job.delay,    notam_interval)
    reg(fetch_earthquakes_job.delay, earthquake_interval)
    reg(fetch_forex_job.delay,     forex_interval)
    # Daily newsletter jobs — interval = 24h so they fire once per scheduler cycle per day
    reg(enqueue_generate_newsletter, newsletter_generate_hour * 60)
    # TODO: Enable After AWS SES is configured properly
    # reg(enqueue_send_newsletter,     newsletter_send_hour * 60)

    print(
        "Scheduler running: "
        f"articles every {fetch_interval}m, "
        f"process every {process_interval}m, "
        f"aggregate every {aggregate_interval}m | "
        f"prices every {price_interval}m, "
        f"notam every {notam_interval}m, "
        f"earthquakes every {earthquake_interval}m, "
        f"forex every {forex_interval}m | "
        f"newsletter generate at ~{newsletter_generate_hour:02d}:00 UTC, "
        f"send at ~{newsletter_send_hour:02d}:00 UTC"
    )

    scheduler.start()


if __name__ == "__main__":
    run_scheduler()
