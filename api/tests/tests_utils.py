"""Dependency-light self-tests for services/utils.py's mark_stage — the
per-record pipeline-stage-status tracker used across workflow/articles.py,
workflow/events.py, and workflow/topics.py.

No database or network required — mark_stage operates on any object with a
(possibly absent) stage_status attribute.

Run standalone:
    DJANGO_SETTINGS_MODULE=settings.base python -m tests.tests_utils
"""

from types import SimpleNamespace

from tests._runner import bootstrap_django, run

bootstrap_django()


def test_mark_stage_ok_true_has_no_error():
    from services.utils import mark_stage
    record = SimpleNamespace(stage_status={})
    status = mark_stage(record, 'process', ok=True)
    assert status['process']['ok'] is True
    assert status['process']['error'] is None
    assert 'at' in status['process']


def test_mark_stage_ok_false_keeps_error():
    from services.utils import mark_stage
    record = SimpleNamespace(stage_status={})
    status = mark_stage(record, 'tag', ok=False, error='no candidates')
    assert status['tag']['ok'] is False
    assert status['tag']['error'] == 'no candidates'


def test_mark_stage_ok_true_drops_error_even_if_passed():
    from services.utils import mark_stage
    record = SimpleNamespace(stage_status={})
    status = mark_stage(record, 'process', ok=True, error='should be ignored')
    assert status['process']['error'] is None


def test_mark_stage_sets_attribute_on_record():
    from services.utils import mark_stage
    record = SimpleNamespace(stage_status={})
    mark_stage(record, 'route', ok=True)
    assert 'route' in record.stage_status


def test_mark_stage_preserves_other_stages():
    from services.utils import mark_stage
    record = SimpleNamespace(stage_status={'process': {'ok': True, 'at': 'x', 'error': None}})
    mark_stage(record, 'tag', ok=True)
    assert 'process' in record.stage_status
    assert 'tag' in record.stage_status


def test_mark_stage_overwrites_same_stage():
    from services.utils import mark_stage
    record = SimpleNamespace(stage_status={})
    mark_stage(record, 'tag', ok=False, error='keyword fallback')
    mark_stage(record, 'tag', ok=True)
    assert record.stage_status['tag']['ok'] is True
    assert record.stage_status['tag']['error'] is None


def test_mark_stage_handles_missing_stage_status_attribute():
    from services.utils import mark_stage
    record = SimpleNamespace()  # no stage_status attribute at all
    status = mark_stage(record, 'process', ok=True)
    assert status == {'process': {'ok': True, 'at': status['process']['at'], 'error': None}}


def test_mark_stage_returns_the_same_dict_it_sets():
    from services.utils import mark_stage
    record = SimpleNamespace(stage_status={})
    status = mark_stage(record, 'process', ok=True)
    assert status is record.stage_status


# ── Runner ────────────────────────────────────────────────────────────────────

_TESTS = [
    test_mark_stage_ok_true_has_no_error,
    test_mark_stage_ok_false_keeps_error,
    test_mark_stage_ok_true_drops_error_even_if_passed,
    test_mark_stage_sets_attribute_on_record,
    test_mark_stage_preserves_other_stages,
    test_mark_stage_overwrites_same_stage,
    test_mark_stage_handles_missing_stage_status_attribute,
    test_mark_stage_returns_the_same_dict_it_sets,
]


if __name__ == '__main__':
    run(_TESTS)
