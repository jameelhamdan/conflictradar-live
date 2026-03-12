from django.core.management.base import BaseCommand


class BaseTaskCommand(BaseCommand):
    """Base class for management commands that wrap RQ background tasks."""

    JOB_TIMEOUT = 1800

    def enqueue(self, task_fn, *args, **kwargs):
        """Enqueue task_fn on the default RQ queue and print a success message."""
        if hasattr(task_fn, "delay"):
            task_fn.delay(*args, **kwargs)
        else:
            import django_rq

            django_rq.get_queue("default").enqueue(task_fn, *args, job_timeout=self.JOB_TIMEOUT, **kwargs)

        self.stdout.write(self.style.SUCCESS(f"Enqueued {task_fn.__name__}"))
