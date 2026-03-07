"""RQ job entrypoints for newsletter generation and sending.

Business logic lives in :mod:`services.newsletter`; this module provides thin
RQ wrappers and enqueue helpers.
"""

import logging
import os

from django_rq import job

from services.newsletter import generate_newsletter, send_newsletter

logger = logging.getLogger(__name__)

JOB_TIMEOUT_SECONDS = int(os.getenv("JOB_TIMEOUT_SECONDS", "1800"))


@job("default", timeout=JOB_TIMEOUT_SECONDS)
def generate_newsletter_job(date_str: str | None = None) -> str:
    """RQ job wrapper for :func:`services.newsletter.generate_newsletter`."""
    return generate_newsletter(date_str=date_str)


@job("default", timeout=JOB_TIMEOUT_SECONDS)
def send_newsletter_job(date_str: str | None = None) -> str:
    """RQ job wrapper for :func:`services.newsletter.send_newsletter`."""
    return send_newsletter(date_str=date_str)


def enqueue_generate_newsletter() -> None:
    generate_newsletter_job.delay()


def enqueue_send_newsletter() -> None:
    send_newsletter_job.delay()

