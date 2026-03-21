from django.contrib import admin, messages
from django.shortcuts import redirect

from newsletter.models import DailyNewsletter, Subscriber


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ['email', 'is_active', 'subscribed_at', 'confirmed_at', 'unsubscribed_at']
    list_filter = ['is_active']
    search_fields = ['email']
    readonly_fields = ['token', 'subscribed_at', 'confirmed_at', 'unsubscribed_at']


def _generate(modeladmin, request, queryset):
    """Enqueue generate jobs for the selected dates."""
    from newsletter.tasks import generate_newsletter_task
    for nl in queryset:
        try:
            generate_newsletter_task.delay(str(nl.date))
            modeladmin.message_user(request, f'Generate job enqueued for {nl.date}.', messages.SUCCESS)
        except Exception as exc:
            modeladmin.message_user(request, f'Failed to enqueue generate for {nl.date}: {exc}', messages.ERROR)


_generate.short_description = 'Enqueue generate for selected dates'


def _send(modeladmin, request, queryset):
    """Enqueue send jobs for the selected dates."""
    from newsletter.tasks import send_newsletter_task
    for nl in queryset:
        try:
            send_newsletter_task.delay(str(nl.date))
            modeladmin.message_user(request, f'Send job enqueued for {nl.date}.', messages.SUCCESS)
        except Exception as exc:
            modeladmin.message_user(request, f'Failed to enqueue send for {nl.date}: {exc}', messages.ERROR)


_send.short_description = 'Enqueue send for selected dates'


def _regenerate(modeladmin, request, queryset):
    """Delete selected newsletters then enqueue generate jobs for those dates."""
    from newsletter.tasks import generate_newsletter_task
    dates = list(queryset.values_list('date', flat=True))
    queryset.delete()
    for date in dates:
        try:
            generate_newsletter_task.delay(str(date))
            modeladmin.message_user(request, f'Deleted + generate job enqueued for {date}.', messages.SUCCESS)
        except Exception as exc:
            modeladmin.message_user(request, f'Deleted but failed to enqueue generate for {date}: {exc}', messages.ERROR)


_regenerate.short_description = 'Delete and re-generate selected newsletters'


@admin.register(DailyNewsletter)
class DailyNewsletterAdmin(admin.ModelAdmin):
    change_list_template = 'admin/newsletter/dailynewsletter/change_list.html'

    list_display = ['date', 'subject', 'status', 'event_count', 'sent_count', 'sent_at', 'generated_at']
    list_filter = ['status']
    search_fields = ['subject']
    readonly_fields = ['generated_at', 'sent_at', 'sent_count', 'articles', 'cover_image_url', 'cover_image_credit']
    actions = [_generate, _send, _regenerate]

    def changelist_view(self, request, extra_context=None):
        if request.method == 'POST' and 'pipeline_action' in request.POST:
            return self._handle_pipeline_action(request)
        return super().changelist_view(request, extra_context=extra_context)

    def _handle_pipeline_action(self, request):
        from services.newsletter import generate_newsletter, send_newsletter

        action = request.POST['pipeline_action']

        if action == 'generate':
            date_str = request.POST.get('newsletter_date') or None
            try:
                result = generate_newsletter(date_str=date_str)
                self.message_user(request, result, messages.SUCCESS)
            except Exception as exc:
                self.message_user(request, f'Generate failed: {exc}', messages.ERROR)

        elif action == 'send':
            date_str = request.POST.get('send_date') or None
            try:
                result = send_newsletter(date_str=date_str)
                self.message_user(request, result, messages.SUCCESS)
            except Exception as exc:
                self.message_user(request, f'Send failed: {exc}', messages.ERROR)

        elif action == 'generate_and_send':
            date_str = request.POST.get('all_date') or None
            try:
                result = generate_newsletter(date_str=date_str)
                self.message_user(request, result, messages.SUCCESS)
            except Exception as exc:
                self.message_user(request, f'Generate failed: {exc}', messages.ERROR)
            try:
                result = send_newsletter(date_str=date_str)
                self.message_user(request, result, messages.SUCCESS)
            except Exception as exc:
                self.message_user(request, f'Send failed: {exc}', messages.ERROR)

        else:
            self.message_user(request, f'Unknown action: {action}', messages.ERROR)

        return redirect(request.path)
