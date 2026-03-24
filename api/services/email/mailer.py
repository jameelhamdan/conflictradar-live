"""Business-level email senders — render, send, and log every email."""
import logging

from django.conf import settings
from django.template.loader import render_to_string

from services.email.providers import get_email_service, EmailError, BaseEmailService

logger = logging.getLogger(__name__)


def _log(to: str, subject: str, email_type: str, *, error: str = '') -> None:
    from misc.models import EmailLog
    EmailLog.objects.create(
        to=to,
        subject=subject,
        email_type=email_type,
        status=EmailLog.STATUS_FAILED if error else EmailLog.STATUS_SENT,
        error=error,
    )


def send_confirmation_email(sub) -> None:
    """Render and send a subscription confirmation email, then log the result."""
    base_url = getattr(settings, 'NEWSLETTER_BASE_URL', 'http://localhost')
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'newsletter@localhost')
    confirm_url = f'{base_url}/newsletter/confirm/{sub.token}'
    subject = f'Confirm your subscription — {settings.APP_NAME}'

    context = {'confirm_url': confirm_url, 'app_name': settings.APP_NAME}
    html = render_to_string('newsletter/confirm_email.html', context)
    text = render_to_string('newsletter/confirm_email.txt', context)

    try:
        get_email_service().send(to=sub.email, subject=subject, html=html, text=text, from_email=from_email)
        _log(sub.email, subject, 'confirmation')
    except EmailError as exc:
        logger.error('Failed to send confirmation email to %s: %s', sub.email, exc)
        _log(sub.email, subject, 'confirmation', error=str(exc))


def send_newsletter_email(
    email_svc: BaseEmailService,
    sub,
    subject: str,
    html: str,
    text: str,
    from_email: str,
    unsubscribe_url: str,
) -> bool:
    """Send a newsletter to one subscriber and log the result. Returns True on success."""
    try:
        email_svc.send(
            to=sub.email,
            subject=subject,
            html=html,
            text=text,
            from_email=from_email,
            headers={'List-Unsubscribe': f'<{unsubscribe_url}>'},
        )
        _log(sub.email, subject, 'newsletter')
        return True
    except EmailError as exc:
        logger.error('Failed to send newsletter to %s: %s', sub.email, exc)
        _log(sub.email, subject, 'newsletter', error=str(exc))
        return False
