from django.contrib import admin
from django.template.response import TemplateResponse
from .models import CeleryMonitor, EmailLog


@admin.register(CeleryMonitor)
class CeleryMonitorAdmin(admin.ModelAdmin):
    """Live RQ queue inspector — no DB backing, uses the django-rq API."""

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        import django_rq
        from rq import Queue
        from rq.worker import Worker

        conn = django_rq.get_connection('default')
        queue = Queue(connection=conn)

        active = []
        for worker in Worker.all(connection=conn):
            job = worker.get_current_job()
            if job:
                active.append({
                    'name': job.func_name,
                    'id': job.id,
                    'args': job.args,
                    'kwargs': job.kwargs,
                    'hostname': worker.name,
                })

        queued = []
        for job in queue.get_jobs():
            queued.append({
                'name': job.func_name,
                'id': job.id,
                'args': job.args,
                'kwargs': job.kwargs,
            })

        try:
            from rq_scheduler import Scheduler
            scheduler = Scheduler(connection=conn)
            scheduled = [
                {
                    'name': job.func_name,
                    'id': job.id,
                    'eta': job.meta.get('interval') or job.meta.get('cron_string') or '—',
                }
                for job in scheduler.get_jobs()
            ]
        except Exception:
            scheduled = []

        context = {
            **self.admin_site.each_context(request),
            "title": "Queue Monitor",
            "opts": self.model._meta,
            "active": active,
            "reserved": queued,
            "scheduled": scheduled,
        }
        return TemplateResponse(request, "admin/misc/celery_monitor.html", context)


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ['to', 'email_type', 'subject', 'status', 'sent_at']
    list_filter = ['email_type', 'status']
    search_fields = ['to', 'subject']
    readonly_fields = ['to', 'subject', 'email_type', 'status', 'error', 'sent_at']
    ordering = ['-sent_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
