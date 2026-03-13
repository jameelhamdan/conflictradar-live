from django.urls import path
from api.views.events import (
    EventListView, EventDetailView, SourceListView,
    PriceLatestView, PriceHistoryView,
    NotamZoneListView, NotamHistoryView,
    EarthquakeListView, StaticPointListView,
    SSEStreamView,
)
from api.views.newsletter import (
    SubscribeView, ConfirmView, UnsubscribeView,
    NewsletterListView, NewsletterLatestView, NewsletterDetailView,
)

urlpatterns = [
    # ── Events & sources ──────────────────────────────────────────────────────
    path('events/', EventListView.as_view(), name='event-list'),
    path('events/<str:event_id>/', EventDetailView.as_view(), name='event-detail'),
    path('sources/', SourceListView.as_view(), name='source-list'),

    # ── Price streams ─────────────────────────────────────────────────────────
    path('prices/latest/', PriceLatestView.as_view(), name='price-latest'),
    path('prices/<str:symbol>/', PriceHistoryView.as_view(), name='price-history'),

    # ── NOTAMs ────────────────────────────────────────────────────────────────
    path('notams/', NotamZoneListView.as_view(), name='notam-zones'),
    path('notams/history/', NotamHistoryView.as_view(), name='notam-history'),

    # ── Earthquakes ───────────────────────────────────────────────────────────
    path('earthquakes/', EarthquakeListView.as_view(), name='earthquake-list'),

    # ── Static reference points ───────────────────────────────────────────────
    path('static-points/', StaticPointListView.as_view(), name='static-point-list'),

    # ── Server-Sent Events ────────────────────────────────────────────────────
    path('sse/', SSEStreamView.as_view(), name='sse-stream'),

    # ── Newsletter ────────────────────────────────────────────────────────────
    path('newsletter/', NewsletterListView.as_view(), name='newsletter-list'),
    path('newsletter/latest/', NewsletterLatestView.as_view(), name='newsletter-latest'),
    path('newsletter/subscribe/', SubscribeView.as_view(), name='newsletter-subscribe'),
    path('newsletter/confirm/<uuid:token>/', ConfirmView.as_view(), name='newsletter-confirm'),
    path('newsletter/unsubscribe/<uuid:token>/', UnsubscribeView.as_view(), name='newsletter-unsubscribe'),
    path('newsletter/<str:date>/', NewsletterDetailView.as_view(), name='newsletter-detail'),
]
