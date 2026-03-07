from django.contrib import admin

from newsletter.models import DailyNewsletter, Subscriber


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ['email', 'is_active', 'subscribed_at', 'confirmed_at', 'unsubscribed_at']
    list_filter = ['is_active']
    search_fields = ['email']
    readonly_fields = ['token', 'subscribed_at', 'confirmed_at', 'unsubscribed_at']


@admin.register(DailyNewsletter)
class DailyNewsletterAdmin(admin.ModelAdmin):
    list_display = ['date', 'subject', 'status', 'event_count', 'sent_count', 'sent_at', 'generated_at']
    list_filter = ['status']
    search_fields = ['subject']
    readonly_fields = ['generated_at', 'sent_at', 'sent_count']
