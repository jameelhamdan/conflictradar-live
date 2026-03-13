from django.contrib import admin
from .models import EmailLog


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
