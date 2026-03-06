"""
TelegramService — fetch messages from a public Telegram channel via the
official MTProto API using Telethon.

Required credentials (stored in source.headers):
  TELEGRAM_API_ID      — integer app id from https://my.telegram.org
  TELEGRAM_API_HASH    — app hash from https://my.telegram.org
  TELEGRAM_SESSION     — base64 session string (generate once with the
                         management command: python manage.py telegram_session)

source.author_slug   → channel username (without @), e.g. "rtnews"
"""
import datetime
import logging
from typing import Iterator, TYPE_CHECKING

from telethon.sync import TelegramClient  # type: ignore[import-untyped]
from telethon.sessions import StringSession  # type: ignore[import-untyped]
from telethon.errors import (  # type: ignore[import-untyped]
    ChannelPrivateError,
    UsernameNotOccupiedError,
    SessionPasswordNeededError,
)

from services.data.base import BaseClientService, ArticleDatum, ClientServiceException

if TYPE_CHECKING:
    import core.models

logger = logging.getLogger(__name__)

_MESSAGE_LIMIT = 200  # max messages fetched per call


class TelegramException(ClientServiceException):
    code = 'telegram_error'


class TelegramService(BaseClientService):
    def __init__(self, source: 'core.models.Source'):
        super().__init__(source)
        self.channel = source.author_slug

        api_id_raw = source.get_header('TELEGRAM_API_ID')
        api_hash = source.get_header('TELEGRAM_API_HASH')
        session_str = source.get_header('TELEGRAM_SESSION', '')

        if not api_id_raw or not api_hash:
            raise TelegramException(
                f'Source "{source.code}" is missing TELEGRAM_API_ID / TELEGRAM_API_HASH in headers. '
                'Obtain them at https://my.telegram.org and store in the source headers.'
            )
        if not session_str:
            raise TelegramException(
                f'Source "{source.code}" is missing TELEGRAM_SESSION in headers. '
                'Run: python manage.py telegram_session <source_code> to generate it.'
            )

        try:
            self._api_id = int(api_id_raw)
        except (TypeError, ValueError):
            raise TelegramException(
                f'TELEGRAM_API_ID for source "{source.code}" must be an integer.'
            )

        self._api_hash = api_hash
        self._session_str = session_str

    def fetch_data(self, start_date: datetime.datetime) -> Iterator[ArticleDatum]:
        if not self.channel:
            raise TelegramException(f'Source "{self.source.code}" has no author_slug (channel name).')

        if start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=datetime.timezone.utc)

        logger.info('TelegramService channel=%r since=%s', self.channel, start_date)

        client = TelegramClient(
            StringSession(self._session_str),
            self._api_id,
            self._api_hash,
            system_version='4.16.30-vxCUSTOM',
        )

        try:
            client.connect()
        except Exception as exc:
            raise TelegramException(f'Failed to connect to Telegram: {exc}')

        if not client.is_user_authorized():
            client.disconnect()
            raise TelegramException(
                f'Session for source "{self.source.code}" is not authorised. '
                'Re-run: python manage.py telegram_session <source_code>'
            )

        try:
            yield from self._iter_messages(client, start_date)
        finally:
            client.disconnect()

    def _iter_messages(
        self,
        client: TelegramClient,
        start_date: datetime.datetime,
    ) -> Iterator[ArticleDatum]:
        try:
            messages = client.get_messages(
                self.channel,
                limit=_MESSAGE_LIMIT,
                offset_date=start_date,
                # reverse=True → returns messages AFTER offset_date (oldest first)
                reverse=True,
            )
        except ChannelPrivateError:
            raise TelegramException(f'Channel @{self.channel} is private or inaccessible.')
        except UsernameNotOccupiedError:
            raise TelegramException(f'Channel @{self.channel} does not exist.')
        except SessionPasswordNeededError:
            raise TelegramException('2FA password required — use a session without 2FA.')
        except Exception as exc:
            raise TelegramException(f'Error fetching messages from @{self.channel}: {exc}')

        yielded = 0
        for msg in messages:
            if not msg.text:
                continue

            published_on: datetime.datetime = msg.date
            if published_on.tzinfo is None:
                published_on = published_on.replace(tzinfo=datetime.timezone.utc)

            if published_on <= start_date:
                continue

            content = msg.text.strip()
            if not content:
                continue

            yielded += 1
            logger.debug('msg id=%d: %.80r', msg.id, content)
            yield ArticleDatum(
                source_url=f'https://t.me/{self.channel}/{msg.id}',
                author=self.channel,
                author_slug=self.channel,
                title=content[:200],
                content=content,
                published_on=published_on,
                extra_data={'message_id': msg.id, 'channel': self.channel},
            )

        logger.info('channel=%r: yielded %d message(s)', self.channel, yielded)
