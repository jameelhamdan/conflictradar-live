"""Queue helper — thin wrapper around django-rq.

Use ``enqueue(func, *args, **kwargs)`` everywhere instead of calling
``queue.enqueue()`` directly.  When ``TASK_QUEUE_ENABLED=False`` (the dev
default) the function is called synchronously in the current process instead
of being pushed to Redis.

Every execution is recorded as a ``core.models.TaskRun`` row (status, duration,
item count, error) by the central ``_execute_tracked`` wrapper — so the admin
operations dashboard has true per-run history with no per-task boilerplate.
"""

import logging
import os
import time

import django_rq
from django.conf import settings

logger = logging.getLogger(__name__)

_JOB_TIMEOUT = int(os.getenv("JOB_TIMEOUT_SECONDS", "1800"))


def _result_count(result):
    """Best-effort item count from a task's return value (int / numbers / dict)."""
    if isinstance(result, bool) or result is None:
        return None
    if isinstance(result, (int, float)):
        return int(result)
    if isinstance(result, dict):
        nums = [v for v in result.values() if isinstance(v, (int, float)) and not isinstance(v, bool)]
        return int(sum(nums)) if nums else None
    if isinstance(result, (list, tuple)):
        nums = [v for v in result if isinstance(v, (int, float)) and not isinstance(v, bool)]
        return int(sum(nums)) if nums else None
    return None


def _safe_params(args, kwargs):
    """JSON-safe snapshot of task params for the TaskRun row."""
    def _ser(v):
        if isinstance(v, (str, int, float, bool)) or v is None:
            return v
        return str(v)[:120]
    try:
        return {'args': [_ser(a) for a in args], 'kwargs': {k: _ser(v) for k, v in kwargs.items()}}
    except Exception:  # noqa: BLE001
        return {}


def _execute_tracked(func, args, kwargs, queue_name):
    """Run *func* while recording a TaskRun row. Used in both sync and RQ modes."""
    from django.utils import timezone

    job_id = ''
    try:
        from rq import get_current_job
        job = get_current_job()
        if job is not None:
            job_id = job.id
    except Exception:  # noqa: BLE001 — not running under RQ
        pass

    run = None
    started = timezone.now()
    t0 = time.monotonic()
    try:
        from core.models import TaskRun
        run = TaskRun.objects.create(
            task_name=getattr(func, '__name__', str(func)), queue=queue_name,
            status='running', started_at=started,
            params=_safe_params(args, kwargs), job_id=job_id,
        )
    except Exception as exc:  # noqa: BLE001 — never let tracking break the task
        logger.debug('[queue] could not create TaskRun: %s', exc)

    try:
        result = func(*args, **kwargs)
    except Exception as exc:  # noqa: BLE001
        _finalize(run, 'failed', t0, error=repr(exc)[:4000])
        raise
    _finalize(run, 'success', t0, items=_result_count(result))
    return result


def _finalize(run, status, t0, items=None, error=''):
    if run is None:
        return
    from django.utils import timezone
    try:
        run.status = status
        run.finished_at = timezone.now()
        run.duration_ms = int((time.monotonic() - t0) * 1000)
        if items is not None:
            run.items = items
        if error:
            run.error = error
        run.save(update_fields=['status', 'finished_at', 'duration_ms', 'items', 'error'])
    except Exception as exc:  # noqa: BLE001
        logger.debug('[queue] could not finalize TaskRun: %s', exc)


def enqueue(func, *args, queue: str = 'default', job_timeout: int | None = None,
            retry=None, depends_on=None, **kwargs):
    """Enqueue *func* on an RQ queue, recording a TaskRun.

    ``queue`` selects ``'default'`` (light I/O) or ``'heavy'`` (NLP / LLM).
    Falls back to a direct synchronous call when ``TASK_QUEUE_ENABLED`` is
    ``False`` so local development works without Redis.

    ``job_timeout`` overrides the global default (``JOB_TIMEOUT_SECONDS``); pass
    ``-1`` for no timeout. ``retry`` (an ``rq.Retry``) and ``depends_on`` (job or
    list of jobs/ids) are forwarded to RQ when queuing is enabled — they enable
    backoff retries (WA3.5) and the dispatcher→fan-in pattern (WA3). Returns the
    RQ ``Job`` when queued, or the function's result when run synchronously.
    """
    if getattr(settings, 'TASK_QUEUE_ENABLED', False):
        rq_queue = django_rq.get_queue(queue)
        timeout = job_timeout if job_timeout is not None else _JOB_TIMEOUT
        enqueue_kwargs = {'job_timeout': timeout}
        if retry is not None:
            enqueue_kwargs['retry'] = retry
        if depends_on is not None:
            enqueue_kwargs['depends_on'] = depends_on
        return rq_queue.enqueue(_execute_tracked, func, args, kwargs, queue, **enqueue_kwargs)
    return _execute_tracked(func, args, kwargs, queue)


def make_retry(max_attempts: int = 3, intervals=None):
    """Build an ``rq.Retry`` (or None if queuing disabled / RQ unavailable)."""
    if not getattr(settings, 'TASK_QUEUE_ENABLED', False):
        return None
    try:
        from rq import Retry
        return Retry(max=max_attempts, interval=intervals or [60, 300, 900])
    except Exception:  # noqa: BLE001
        return None
