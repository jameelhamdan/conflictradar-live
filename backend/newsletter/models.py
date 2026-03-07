import uuid

from django.db import models
from django_mongodb_backend.managers import MongoManager


class Subscriber(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('unsubscribed', 'Unsubscribed'),
    ]

    email = models.CharField(max_length=254, unique=True)
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=False)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)

    objects = MongoManager()

    class Meta:
        ordering = ['-subscribed_at']

    def __str__(self):
        return self.email


class DailyNewsletter(models.Model):
    STATUS_DRAFT = 'draft'
    STATUS_SENDING = 'sending'
    STATUS_SENT = 'sent'
    STATUS_ERROR = 'error'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_SENDING, 'Sending'),
        (STATUS_SENT, 'Sent'),
        (STATUS_ERROR, 'Error'),
    ]

    date = models.DateField(unique=True)
    subject = models.CharField(max_length=255)
    html_body = models.TextField()
    text_body = models.TextField()
    generated_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    sent_count = models.IntegerField(default=0)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    event_count = models.IntegerField(default=0)

    objects = MongoManager()

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f'{self.date} — {self.subject}'
