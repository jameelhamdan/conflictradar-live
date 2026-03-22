"""Task functions for newsletter generation and sending.

Business logic lives in :mod:`services.newsletter`; this module provides thin
wrappers enqueued via django-rq (services.queue.enqueue).
"""

import logging

from services.newsletter import generate_newsletter, send_newsletter

logger = logging.getLogger(__name__)


def generate_newsletter_task(date_str: str | None = None) -> str:
    return generate_newsletter(date_str=date_str)


def send_newsletter_task(date_str: str | None = None) -> str:
    return send_newsletter(date_str=date_str)
