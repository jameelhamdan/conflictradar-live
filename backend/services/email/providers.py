"""
Multi-provider email service.

Configure via settings (or .env):
  EMAIL_PROVIDER          'ses' (default) or 'smtp'

AWS SES (used when EMAIL_PROVIDER=ses):
  AWS_SES_ACCESS_KEY_ID   AWS access key with ses:SendRawEmail permission
  AWS_SES_SECRET_KEY      AWS secret access key
  AWS_SES_REGION          SES region, e.g. 'eu-west-1' (default: 'us-east-1')
  DEFAULT_FROM_EMAIL      Verified sender address

SMTP (used when EMAIL_PROVIDER=smtp — good for dev/staging):
  EMAIL_HOST, EMAIL_PORT, EMAIL_USE_TLS
  EMAIL_HOST_USER, EMAIL_HOST_PASSWORD
  DEFAULT_FROM_EMAIL

Usage:
    from services.email import get_email_service

    svc = get_email_service()
    svc.send(
        to='user@example.com',
        subject='Hello',
        html='<p>Hello</p>',
        text='Hello',
    )
"""
import logging
from abc import ABC, abstractmethod
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from django.conf import settings

logger = logging.getLogger(__name__)


class EmailError(Exception):
    pass


class BaseEmailService(ABC):
    @abstractmethod
    def send(
        self,
        to: str,
        subject: str,
        html: str,
        text: str,
        from_email: str | None = None,
        headers: dict | None = None,
    ) -> None:
        """Send a single email with HTML + plain-text alternatives."""


class SESEmailService(BaseEmailService):
    """
    AWS SES provider using boto3 send_raw_email.

    Sends a MIME multipart/alternative message (text + html) directly via the
    SES API — no SMTP relay needed.
    """

    def __init__(self) -> None:
        import boto3

        access_key = getattr(settings, 'AWS_SES_ACCESS_KEY_ID', '')
        secret_key = getattr(settings, 'AWS_SES_SECRET_KEY', '')
        region = getattr(settings, 'AWS_SES_REGION', 'eu-north-1')

        if not access_key or not secret_key:
            raise EmailError(
                'AWS_SES_ACCESS_KEY_ID and AWS_SES_SECRET_KEY must be set '
                'when EMAIL_PROVIDER=ses'
            )

        self._client = boto3.client(
            'ses',
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )
        self._default_from = getattr(settings, 'DEFAULT_FROM_EMAIL', '')

    def send(
        self,
        to: str,
        subject: str,
        html: str,
        text: str,
        from_email: str | None = None,
        headers: dict | None = None,
    ) -> None:
        sender = from_email or self._default_from
        if not sender:
            raise EmailError('No from_email provided and DEFAULT_FROM_EMAIL is not set.')

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = sender
        msg['To'] = to
        if headers:
            for key, value in headers.items():
                msg[key] = value

        msg.attach(MIMEText(text, 'plain', 'utf-8'))
        msg.attach(MIMEText(html, 'html', 'utf-8'))

        try:
            self._client.send_raw_email(
                Source=sender,
                Destinations=[to],
                RawMessage={'Data': msg.as_string()},
            )
        except Exception as exc:
            logger.error('SES send_raw_email failed to %s: %s', to, exc)
            raise EmailError(f'SES error: {exc}') from exc


class SMTPEmailService(BaseEmailService):
    """
    SMTP provider using Django's built-in email backend.
    Falls back to console backend in development.
    """

    def send(
        self,
        to: str,
        subject: str,
        html: str,
        text: str,
        from_email: str | None = None,
        headers: dict | None = None,
    ) -> None:
        from django.core.mail import EmailMultiAlternatives

        sender = from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'newsletter@localhost')
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text,
                from_email=sender,
                to=[to],
                headers=headers or {},
            )
            msg.attach_alternative(html, 'text/html')
            msg.send()
        except Exception as exc:
            logger.error('SMTP send failed to %s: %s', to, exc)
            raise EmailError(f'SMTP error: {exc}') from exc


def get_email_service() -> BaseEmailService:
    """Return the configured email provider (ses or smtp)."""
    provider = getattr(settings, 'EMAIL_PROVIDER', 'ses')
    if provider == 'ses':
        return SESEmailService()
    return SMTPEmailService()
