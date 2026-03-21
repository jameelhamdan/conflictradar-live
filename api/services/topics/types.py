"""Shared type definitions for the topics pipeline."""
from typing import TypedDict


class _TopicDictRequired(TypedDict):
    slug: str
    name: str
    keywords: list[str]
    source_id: str


class TopicDict(_TopicDictRequired, total=False):
    """Normalized topic dict produced by any TopicSourceAdapter."""
    description: str
    category: str
    source_url: str
    parent: str
    approximate_start: str
    is_current: bool
    source_ids: list[str]
