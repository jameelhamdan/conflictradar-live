from django.core.management.base import BaseCommand


class BaseTaskCommand(BaseCommand):
    """Base class for management commands that wrap Celery background tasks.

    Subclasses accept a ``--background`` flag:
      - Without ``--background``: the task function is called directly in the
        current process (always synchronous, no Celery required).
      - With ``--background``: the task is enqueued via Celery.  When
        ``TASK_QUEUE_ENABLED=False`` (default in dev), Celery's ALWAYS_EAGER
        mode runs it synchronously anyway.
    """
