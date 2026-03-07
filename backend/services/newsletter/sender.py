"""Newsletter sending business logic."""

import logging

from django.conf import settings

from .generator import UNSUB_PLACEHOLDER

logger = logging.getLogger(__name__)


def send_newsletter(date_str: str | None = None) -> str:
    """
    Send the DailyNewsletter for the given date (YYYY-MM-DD) or today
    to all active subscribers. Idempotent — skips if already sent.
    Returns a status message string.
    """
    from datetime import date

    from django.utils import timezone

    from newsletter.models import DailyNewsletter, Subscriber
    from services.email import get_email_service, EmailError

    if date_str:
        target_date = date.fromisoformat(date_str)
    else:
        target_date = timezone.now().date()

    try:
        newsletter = DailyNewsletter.objects.get(date=target_date)
    except DailyNewsletter.DoesNotExist:
        raise ValueError(f"No newsletter found for {target_date}. Run generate_newsletter first.")

    if newsletter.status == DailyNewsletter.STATUS_SENT:
        return f"Newsletter for {target_date} was already sent ({newsletter.sent_count} recipients)."

    subscribers = list(Subscriber.objects.filter(is_active=True))
    if not subscribers:
        return f"No active subscribers — newsletter for {target_date} not sent."

    base_url = getattr(settings, "NEWSLETTER_BASE_URL", "http://localhost")
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "newsletter@localhost")

    newsletter.status = DailyNewsletter.STATUS_SENDING
    newsletter.save()

    email_svc = get_email_service()
    sent = 0
    errors = 0

    for sub in subscribers:
        unsubscribe_url = f"{base_url}/newsletter/unsubscribe/{sub.token}"
        html = newsletter.html_body.replace(UNSUB_PLACEHOLDER, unsubscribe_url)
        text = newsletter.text_body.replace(UNSUB_PLACEHOLDER, unsubscribe_url)
        try:
            email_svc.send(
                to=sub.email,
                subject=newsletter.subject,
                html=html,
                text=text,
                from_email=from_email,
                headers={"List-Unsubscribe": f"<{unsubscribe_url}>"},
            )
            sent += 1
        except EmailError as exc:
            logger.error("Failed to send newsletter to %s: %s", sub.email, exc)
            errors += 1

    newsletter.status = DailyNewsletter.STATUS_SENT if errors == 0 else DailyNewsletter.STATUS_ERROR
    newsletter.sent_at = timezone.now()
    newsletter.sent_count = sent
    newsletter.save()

    logger.info("Sent newsletter %s to %d subscribers (%d errors)", target_date, sent, errors)
    return f"Sent newsletter for {target_date} to {sent} subscribers ({errors} errors)."

