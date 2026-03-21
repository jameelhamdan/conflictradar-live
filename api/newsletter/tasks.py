"""Celery task entrypoints for newsletter generation and sending.

Business logic lives in :mod:`services.newsletter`; this module provides thin
Celery wrappers and enqueue helpers.
"""

import logging
import os

from celery import shared_task

from services.newsletter import generate_newsletter, send_newsletter

logger = logging.getLogger(__name__)

JOB_TIMEOUT_SECONDS = int(os.getenv("JOB_TIMEOUT_SECONDS", "1800"))


@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=2, default_retry_delay=60)
def generate_newsletter_task(date_str: str | None = None) -> str:
    """Celery task wrapper for :func:`services.newsletter.generate_newsletter`."""
    return generate_newsletter(date_str=date_str)


@shared_task(time_limit=JOB_TIMEOUT_SECONDS, max_retries=2, default_retry_delay=60)
def send_newsletter_task(date_str: str | None = None) -> str:
    """Celery task wrapper for :func:`services.newsletter.send_newsletter`."""
    return send_newsletter(date_str=date_str)


def enqueue_generate_newsletter() -> None:
    generate_newsletter_task.delay()


def enqueue_send_newsletter() -> None:
    send_newsletter_task.delay()
