"""Newsletter sending business logic."""

import logging
import re as _re

import markdown as md_lib

from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def _render_email(newsletter, date_str: str, base_url: str, unsubscribe_url: str) -> tuple[str, str]:
    """Convert Markdown body to HTML and plain text for email sending."""
    raw_html = md_lib.markdown(newsletter.body, extensions=['extra'])
    # Inline-style <h2> tags for consistent rendering across email clients
    body_html = _re.sub(
        r'<h2>',
        '<h2 style="margin:1.5em 0 0.4em 0;font-size:1.05rem;font-weight:700;color:#111;'
        'border-bottom:2px solid #e05252;padding-bottom:0.25em;">',
        raw_html,
    )
    context = {
        'subject': newsletter.subject,
        'body_html': body_html,
        'body': newsletter.body,   # raw Markdown — used by briefing.txt plain-text version
        'date_str': date_str,
        'base_url': base_url,
        'unsubscribe_url': unsubscribe_url,
    }
    html = render_to_string('newsletter/briefing.html', context)
    text = render_to_string('newsletter/briefing.txt', context)
    return html, text


def send_newsletter(date_str: str | None = None) -> str:
    """
    Send the DailyNewsletter for the given date (YYYY-MM-DD) or today
    to all active subscribers. Idempotent — skips if already sent.
    Returns a status message string.
    """
    from datetime import date

    from django.utils import timezone

    from newsletter.models import DailyNewsletter, Subscriber
    from services.email.providers import get_email_service
    from services.email.mailer import send_newsletter_email

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

    date_str_display = newsletter.date.strftime('%A, %B %d, %Y')
    email_svc = get_email_service()
    sent = 0
    errors = 0

    for sub in subscribers:
        unsubscribe_url = f"{base_url}/newsletter/unsubscribe/{sub.token}"
        html, text = _render_email(newsletter, date_str_display, base_url, unsubscribe_url)
        if send_newsletter_email(email_svc, sub, newsletter.subject, html, text, from_email, unsubscribe_url):
            sent += 1
        else:
            errors += 1

    newsletter.status = DailyNewsletter.STATUS_SENT if errors == 0 else DailyNewsletter.STATUS_ERROR
    newsletter.sent_at = timezone.now()
    newsletter.sent_count = sent
    newsletter.save()

    logger.info("Sent newsletter %s to %d subscribers (%d errors)", target_date, sent, errors)
    return f"Sent newsletter for {target_date} to {sent} subscribers ({errors} errors)."

