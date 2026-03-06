"""Base class and Redis pub/sub helper for all data streams."""
import json
import logging
import os

import redis as redis_lib

logger = logging.getLogger(__name__)

# Read from env directly — settings.REDIS_URL doesn't exist; the URL is only
# stored inside CACHES['redis-cache']['LOCATION'] after Django setup.
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')


def redis_publish(channel: str, payload: dict) -> None:
    """Publish a JSON payload to a Redis pub/sub channel."""
    try:
        r = redis_lib.from_url(REDIS_URL)
        r.publish(channel, json.dumps(payload))
    except Exception as exc:
        logger.warning(f'[streams] Redis publish failed on {channel}: {exc}')


class BaseStream:
    """
    Abstract base for all data streams.

    Subclasses must implement:
      fetch() -> list[dict]   — pull and normalize records from the source API
      save(records) -> int    — persist records to the DB, return count saved
    """
    stream_type: str = ''

    def fetch(self) -> list[dict]:
        raise NotImplementedError

    def save(self, records: list[dict]) -> int:
        raise NotImplementedError

    def run(self) -> int:
        """fetch → save → publish SSE notification. Returns count saved."""
        logger.info(f'[{self.stream_type}] starting fetch')
        try:
            records = self.fetch()
        except Exception as exc:
            logger.error(f'[{self.stream_type}] fetch failed: {exc}', exc_info=exc)
            return 0

        if not records:
            logger.info(f'[{self.stream_type}] no new records')
            return 0

        try:
            count = self.save(records)
        except Exception as exc:
            logger.error(f'[{self.stream_type}] save failed: {exc}', exc_info=exc)
            return 0

        redis_publish('sse:stream', {'type': self.stream_type, 'count': count})
        logger.info(f'[{self.stream_type}] saved {count} record(s)')
        return count
