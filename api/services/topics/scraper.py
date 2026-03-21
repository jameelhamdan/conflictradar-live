"""
Topic scraper orchestrator.

Fetches topics from Wikipedia's Portal:Current_events (last N days).
Configure the lookback window via TOPIC_SOURCES_DAYS env var (default: 30).
"""
import logging
import os

from services.topics.dedup import deduplicate_topics
from services.topics.sources.current_events import WikipediaCurrentEventsAdapter
from services.topics.types import TopicDict

logger = logging.getLogger(__name__)


class TopicScraper:

    def __init__(self, num_days: int | None = None):
        days = num_days if num_days is not None else int(os.getenv('TOPIC_SOURCES_DAYS', '30'))
        self._adapter = WikipediaCurrentEventsAdapter(num_days=days)

    def scrape_all(self) -> list[TopicDict]:
        try:
            topics = self._adapter.fetch()
            logger.info('[topics] %s → %d topic(s)', self._adapter.source_id, len(topics))
        except Exception as e:
            logger.exception('[topics] %s failed: %s', self._adapter.source_id, e)
            return []

        if not topics:
            return []

        merged = deduplicate_topics(topics)
        logger.info('[topics] scrape_all: %d raw → %d after dedup', len(topics), len(merged))
        return merged
