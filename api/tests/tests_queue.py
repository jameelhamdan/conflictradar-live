"""Dependency-light self-tests for services/queue.py — the enqueue() wrapper
every task call site goes through, and its dev-mode synchronous fallback.

No database, Redis, or RQ worker required — the TASK_QUEUE_ENABLED=True path
mocks django_rq.get_queue() instead of hitting a real broker.

Run standalone:
    DJANGO_SETTINGS_MODULE=settings.base python -m tests.tests_queue
"""

from unittest.mock import MagicMock, patch

from tests._runner import bootstrap_django, run

bootstrap_django()

from django.test import override_settings  # noqa: E402


def test_enqueue_sync_mode_calls_function_directly():
    from services.queue import enqueue

    calls = []

    def fn(a, b, keyword=None):
        calls.append((a, b, keyword))
        return a + b

    with override_settings(TASK_QUEUE_ENABLED=False):
        result = enqueue(fn, 1, 2, keyword='x', queue='heavy')

    assert result == 3
    assert calls == [(1, 2, 'x')]


def test_enqueue_sync_mode_ignores_queue_and_retry_kwargs():
    from services.queue import enqueue

    def fn():
        return 'ok'

    with override_settings(TASK_QUEUE_ENABLED=False):
        # queue/job_timeout/retry/depends_on are RQ-only concerns; sync mode must
        # not choke on them or forward them into the plain function call.
        result = enqueue(fn, queue='heavy', job_timeout=-1, retry=object(), depends_on=object())

    assert result == 'ok'


def test_enqueue_async_mode_delegates_to_rq_queue():
    from services.queue import enqueue

    def fn(x):
        return x

    fake_queue = MagicMock()
    fake_queue.enqueue.return_value = 'fake-job'

    with override_settings(TASK_QUEUE_ENABLED=True):
        with patch('services.queue.django_rq.get_queue', return_value=fake_queue) as get_queue:
            result = enqueue(fn, 42, queue='heavy', job_timeout=-1)

    get_queue.assert_called_once_with('heavy')
    fake_queue.enqueue.assert_called_once_with(fn, 42, job_timeout=-1)
    assert result == 'fake-job'


def test_enqueue_async_mode_passes_retry_and_depends_on():
    from services.queue import enqueue

    fake_queue = MagicMock()
    retry_obj = object()
    depends_obj = object()

    with override_settings(TASK_QUEUE_ENABLED=True):
        with patch('services.queue.django_rq.get_queue', return_value=fake_queue):
            enqueue(lambda: None, queue='default', retry=retry_obj, depends_on=depends_obj)

    _, kwargs = fake_queue.enqueue.call_args
    assert kwargs['retry'] is retry_obj
    assert kwargs['depends_on'] is depends_obj


def test_make_retry_sync_mode_returns_none():
    from services.queue import make_retry
    with override_settings(TASK_QUEUE_ENABLED=False):
        assert make_retry() is None


def test_make_retry_async_mode_builds_rq_retry():
    from services.queue import make_retry
    with override_settings(TASK_QUEUE_ENABLED=True):
        retry = make_retry(max_attempts=5, intervals=[10, 20])
    assert retry is not None
    assert retry.max == 5
    assert retry.intervals == [10, 20]


def test_make_retry_async_mode_default_intervals():
    from services.queue import make_retry
    with override_settings(TASK_QUEUE_ENABLED=True):
        retry = make_retry()
    assert retry is not None
    assert retry.max == 3
    assert retry.intervals == [60, 300, 900]


# ── Runner ────────────────────────────────────────────────────────────────────

_TESTS = [
    test_enqueue_sync_mode_calls_function_directly,
    test_enqueue_sync_mode_ignores_queue_and_retry_kwargs,
    test_enqueue_async_mode_delegates_to_rq_queue,
    test_enqueue_async_mode_passes_retry_and_depends_on,
    test_make_retry_sync_mode_returns_none,
    test_make_retry_async_mode_builds_rq_retry,
    test_make_retry_async_mode_default_intervals,
]


if __name__ == '__main__':
    run(_TESTS)
