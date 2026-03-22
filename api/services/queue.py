"""Queue helper — thin wrapper around django-rq.

Use ``enqueue(func, *args, **kwargs)`` everywhere instead of calling
``queue.enqueue()`` directly.  When ``TASK_QUEUE_ENABLED=False`` (the dev
default) the function is called synchronously in the current process instead
of being pushed to Redis.
"""

import os

import django_rq
from django.conf import settings

_JOB_TIMEOUT = int(os.getenv("JOB_TIMEOUT_SECONDS", "1800"))


def enqueue(func, *args, **kwargs):
    """Enqueue *func* on the default RQ queue.

    Falls back to a direct synchronous call when ``TASK_QUEUE_ENABLED`` is
    ``False`` so that local development works without Redis.
    """
    if getattr(settings, 'TASK_QUEUE_ENABLED', False):
        queue = django_rq.get_queue('default')
        queue.enqueue(func, *args, job_timeout=_JOB_TIMEOUT, **kwargs)
    else:
        func(*args, **kwargs)
