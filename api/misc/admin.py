from django.contrib import admin
from django.template.response import TemplateResponse
from .models import CeleryMonitor, EmailLog


@admin.register(CeleryMonitor)
class CeleryMonitorAdmin(admin.ModelAdmin):
    """Live Celery task inspector — no DB backing, uses the inspect API."""

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        from celery import current_app

        inspect = current_app.control.inspect(timeout=2.0)

        def flatten(mapping):
            return [task for tasks in (mapping or {}).values() for task in tasks]

        active    = flatten(inspect.active())
        reserved  = flatten(inspect.reserved())
        scheduled = flatten(inspect.scheduled())

        context = {
            **self.admin_site.each_context(request),
            "title": "Celery Monitor",
            "opts": self.model._meta,
            "active": active,
            "reserved": reserved,
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
