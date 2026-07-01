"""Dependency-light self-tests for core model schema — pure Django model
introspection (``_meta.get_fields()``), no live Mongo connection required.

Run standalone:
    DJANGO_SETTINGS_MODULE=settings.base python -m tests.tests_models
"""

from tests._runner import bootstrap_django, run

bootstrap_django()


def _field_names(model) -> set[str]:
    return {f.name for f in model._meta.get_fields()}


def test_article_has_importance_fields():
    from core import models as m
    fields = _field_names(m.Article)
    assert 'importance_score' in fields
    assert 'importance_source' in fields


def test_source_has_weight_fields():
    from core import models as m
    fields = _field_names(m.Source)
    assert 'weight' in fields
    assert 'weight_locked' in fields


def test_article_has_nlp_fields():
    from core import models as m
    fields = _field_names(m.Article)
    assert {'entities', 'sentiment', 'finbert_sentiment', 'category', 'sub_category',
            'event_intensity', 'translations', 'llm_usage'} <= fields


def test_event_has_topic_and_routing_fields():
    from core import models as m
    fields = _field_names(m.Event)
    assert {'topics', 'topic_slugs', 'topics_source', 'affected_indicators',
            'router_source', 'llm_usage'} <= fields


# ── Runner ────────────────────────────────────────────────────────────────────

_TESTS = [
    test_article_has_importance_fields,
    test_source_has_weight_fields,
    test_article_has_nlp_fields,
    test_event_has_topic_and_routing_fields,
]


if __name__ == '__main__':
    run(_TESTS)
