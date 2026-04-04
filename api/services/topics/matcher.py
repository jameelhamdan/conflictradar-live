"""
Topic matchers.

TopicMatcher   — keyword-overlap matching (no LLM, fast, used for retroactive tagging).
LLMTopicMatcher — LLM-based batch matching (semantic, used for regular tagging pipeline).
"""
import json
import logging
import os
import re

logger = logging.getLogger(__name__)

_LLM_PREFILTER_K = int(os.getenv('LLM_TOPIC_PREFILTER_K', '30'))


def _prefilter_topics(events: list, topics: list, top_k: int = _LLM_PREFILTER_K) -> list:
    """
    Select the top_k topics most semantically relevant to the event batch using
    sentence-transformer cosine similarity. Falls back to the full list on any error.
    """
    if len(topics) <= top_k:
        return topics
    try:
        from sentence_transformers.util import cos_sim

        from services.processing.clustering import get_clusterer
        model = get_clusterer()._model
        event_texts = [
            ' '.join(filter(None, [e.title, e.location_name, e.category]))
            for e in events
        ]
        topic_texts = [
            ' '.join(filter(None, [t.name, ' '.join(t.keywords or []), getattr(t, 'description', '') or '']))
            for t in topics
        ]
        event_embs = model.encode(event_texts, convert_to_tensor=True, show_progress_bar=False)
        topic_embs = model.encode(topic_texts, convert_to_tensor=True, show_progress_bar=False)
        query = event_embs.mean(dim=0, keepdim=True)
        scores = cos_sim(query, topic_embs)[0]
        top_indices = scores.topk(min(top_k, len(topics))).indices.tolist()
        return [topics[i] for i in top_indices]
    except Exception as exc:
        logger.warning('[topics] embedding prefilter failed (%s) — using all %d topics', exc, len(topics))
        return topics

_SPLIT_RE = re.compile(r'[^a-zA-Z0-9]+')

_STOP = frozenset({
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'of', 'for', 'and', 'or',
    'but', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had',
    'its', 'that', 'this', 'with', 'by', 'from', 'as', 'after', 'amid',
    'over', 'into', 'also', 'not', 'new', 'says', 'said', 'two', 'three',
})

# Minimum fraction of topic keywords that must match for a tag to apply
_MIN_OVERLAP = 0.1
# Minimum absolute keyword matches (whichever is higher wins)
_MIN_MATCHES = 1


def _tokenize(text: str) -> set[str]:
    return {
        t.lower() for t in _SPLIT_RE.split(text or '')
        if len(t) > 2 and t.lower() not in _STOP
    }


class TopicMatcher:

    def match(self, event, topics: list) -> dict[str, float]:
        """
        Match event against topics.

        Args:
            event: Event model instance (uses .title and .location_name)
            topics: list of Topic model instances

        Returns:
            dict mapping slug → confidence score (0.0–1.0) for matched topics
        """
        event_tokens = _tokenize(event.title or '') | _tokenize(event.location_name or '')
        if not event_tokens:
            return {}

        result: dict[str, float] = {}
        for topic in topics:
            kw_tokens: set[str] = set()
            for kw in (topic.keywords or []):
                kw_tokens |= _tokenize(kw)
            kw_tokens |= _tokenize(topic.name)

            if not kw_tokens:
                continue

            overlap = event_tokens & kw_tokens
            n = len(overlap)
            if n < _MIN_MATCHES:
                continue

            frac = n / len(kw_tokens)
            if frac < _MIN_OVERLAP:
                continue

            score = round(min(1.0, 0.3 + frac), 3)
            result[topic.slug] = score

        return result


class EmbeddingTopicMatcher:
    """
    Embedding-based topic matcher using sentence-transformer cosine similarity.

    Used for retroactive tagging (replacing keyword-only TopicMatcher) and as a
    fallback in tag_events_with_topics when the LLM returns no matches for an event.
    Reuses the same model singleton as SemanticClusterer — no second model load.
    """

    THRESHOLD = float(os.getenv('EMBEDDING_MATCH_THRESHOLD', '0.45'))

    def match(self, event, topics: list) -> dict[str, float]:
        """
        Match a single event against a list of topics using cosine similarity.

        Returns dict mapping slug → score for all topics above THRESHOLD.
        Falls back to TopicMatcher on any error.
        """
        if not topics:
            return {}
        try:
            from sentence_transformers.util import cos_sim
            from services.processing.clustering import get_clusterer

            model = get_clusterer()._model
            event_text = ' '.join(filter(None, [event.title, event.location_name, event.category]))
            topic_texts = [
                ' '.join(filter(None, [
                    t.name,
                    ' '.join(t.keywords or []),
                    (getattr(t, 'description', '') or '')[:120],
                ]))
                for t in topics
            ]

            event_emb = model.encode([event_text], convert_to_tensor=True, show_progress_bar=False)
            topic_embs = model.encode(topic_texts, convert_to_tensor=True, show_progress_bar=False)
            scores = cos_sim(event_emb, topic_embs)[0].tolist()

            return {
                topics[i].slug: round(float(s), 3)
                for i, s in enumerate(scores)
                if s >= self.THRESHOLD
            }
        except Exception as exc:
            logger.warning('[topics] EmbeddingTopicMatcher failed (%s) — falling back to TopicMatcher', exc)
            return TopicMatcher().match(event, topics)


class LLMTopicMatcher:
    """
    LLM-based batch topic matcher.

    Sends events to the LLM in batches and returns matched topic slugs with
    confidence scores. Falls back to TopicMatcher per-event on LLM error.
    """

    BATCH_SIZE = 10

    def match_batch(
        self,
        events: list,
        topics: list,
    ) -> dict[str, dict[str, float]]:
        """
        Match a list of Event objects against a list of Topic objects.

        Returns {str(event.pk): {topic_slug: confidence}} for all events.
        Falls back to TopicMatcher on LLM error.
        """
        from services.llm import get_llm_service

        results: dict[str, dict[str, float]] = {str(e.pk): {} for e in events}

        llm = get_llm_service()
        total_batches = (len(events) + self.BATCH_SIZE - 1) // self.BATCH_SIZE

        for batch_start in range(0, len(events), self.BATCH_SIZE):
            batch = events[batch_start: batch_start + self.BATCH_SIZE]
            batch_num = batch_start // self.BATCH_SIZE + 1
            logger.info('[topics] LLM batch %d/%d (%d events)', batch_num, total_batches, len(batch))

            # Pre-filter topics to top-K most relevant for this specific batch
            batch_topics = _prefilter_topics(batch, topics)
            situation_lines = '\n'.join(
                f'- {t.slug}: {t.name}'
                + (f' — {t.description[:120]}' if getattr(t, 'description', '') else '')
                for t in batch_topics
            )
            valid_slugs = {t.slug for t in batch_topics}

            event_lines = '\n'.join(
                f'{i + 1}. (id={e.pk}) {e.title or "(no title)"}'
                f' ({e.location_name or "unknown"} | {e.category or "general"})'
                for i, e in enumerate(batch)
            )

            prompt = (
                'You are a news analyst. Match each news event to the relevant ongoing situations.\n\n'
                f'ONGOING SITUATIONS:\n{situation_lines}\n\n'
                f'EVENTS:\n{event_lines}\n\n'
                'Return a JSON object where each key is the event id value shown as id=<value>,\n'
                'and each value is a dict of matched situation slugs with confidence 0.5–1.0.\n'
                'Only include matches with confidence ≥ 0.5. Use empty object {} if no match.\n'
                'Example: {"abc123": {"russo-ukrainian-war": 0.95}, "def456": {}}\n'
                'Respond with only the JSON object, no other text.'
            )

            try:
                response = llm.chat([{'role': 'user', 'content': prompt}]).strip()
                # Strip markdown code fences if present
                response = re.sub(r'^```(?:json)?\s*', '', response)
                response = re.sub(r'\s*```$', '', response)
                batch_result = json.loads(response)
                if not isinstance(batch_result, dict):
                    raise ValueError('LLM returned non-dict')

                for event in batch:
                    event_key = str(event.pk)
                    raw = batch_result.get(event_key) or {}
                    if not isinstance(raw, dict):
                        raw = {}
                    # Filter to valid slugs and clamp confidence to [0.5, 1.0]
                    cleaned = {
                        slug: round(min(1.0, max(0.5, float(conf))), 3)
                        for slug, conf in raw.items()
                        if slug in valid_slugs
                    }
                    results[event_key] = cleaned
                    if cleaned:
                        logger.info(
                            '[topics] LLM tagged "%s" → %s',
                            (event.title or '')[:60],
                            ', '.join(f'{s}({c:.2f})' for s, c in cleaned.items()),
                        )
                    else:
                        logger.debug('[topics] LLM: no match for "%s"', (event.title or '')[:60])

            except Exception as exc:
                logger.warning(
                    '[topics] LLM batch %d/%d failed (%s) — falling back to TopicMatcher',
                    batch_num, total_batches, exc,
                )
                fallback = TopicMatcher()
                for event in batch:
                    results[str(event.pk)] = fallback.match(event, topics)

        return results
