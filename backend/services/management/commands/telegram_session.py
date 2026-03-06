"""
One-time helper to authenticate a Telegram source and persist the session string.

Usage:
    python manage.py telegram_session <source_code>

The command connects interactively (prompts for phone + OTP, or password if 2FA
is enabled), then saves the resulting session string back to source.headers
under the key TELEGRAM_SESSION. Copy-paste this value into the admin panel if
you prefer not to run it in production.
"""
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Authenticate a Telegram source and save the session string to its headers.'

    def add_arguments(self, parser):
        parser.add_argument('source_code', help='Source.code of the Telegram source')

    def handle(self, *args, **options):
        from telethon.sync import TelegramClient  # type: ignore[import-untyped]
        from telethon.sessions import StringSession  # type: ignore[import-untyped]
        from core.models import Source, SourceType

        code = options['source_code']
        try:
            source = Source.objects.get(code=code)
        except Source.DoesNotExist:
            raise CommandError(f'Source "{code}" not found.')

        if source.type != SourceType.TELEGRAM:
            raise CommandError(f'Source "{code}" is not a Telegram source (type={source.type}).')

        api_id_raw = source.get_header('TELEGRAM_API_ID')
        api_hash = source.get_header('TELEGRAM_API_HASH')

        if not api_id_raw or not api_hash:
            raise CommandError(
                f'Source "{code}" is missing TELEGRAM_API_ID / TELEGRAM_API_HASH in headers.\n'
                'Add them in the admin panel (obtain from https://my.telegram.org).'
            )

        try:
            api_id = int(api_id_raw)
        except ValueError:
            raise CommandError('TELEGRAM_API_ID must be an integer.')

        self.stdout.write(f'Authenticating source "{code}" (channel: @{source.author_slug}) …')
        self.stdout.write('You will be prompted for your phone number and the OTP Telegram sends.\n')

        with TelegramClient(StringSession(), api_id, api_hash) as client:
            session_string = client.session.save()

        # Persist to headers
        headers = dict(source.headers or {})
        headers['TELEGRAM_SESSION'] = session_string
        source.headers = headers
        source.save(update_fields=['headers'])

        self.stdout.write(self.style.SUCCESS(
            f'\nSession saved to source "{code}".\n'
            f'Session string (keep secret):\n{session_string}'
        ))
