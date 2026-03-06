from django.urls import path
from . import views

urlpatterns = [
    # Geopolitical events (text pipeline)
    path('events/', views.EventListView.as_view(), name='event-list'),
    path('events/<str:event_id>/', views.EventDetailView.as_view(), name='event-detail'),
    path('sources/', views.SourceListView.as_view(), name='source-list'),

    # Price streams
    path('prices/latest/', views.PriceLatestView.as_view(), name='price-latest'),
    path('prices/<str:symbol>/', views.PriceHistoryView.as_view(), name='price-history'),

    # NOTAM zones
    path('notams/', views.NotamZoneListView.as_view(), name='notam-zones'),
    path('notams/history/', views.NotamHistoryView.as_view(), name='notam-history'),

    # Earthquakes
    path('earthquakes/', views.EarthquakeListView.as_view(), name='earthquake-list'),

    # Static reference points
    path('static-points/', views.StaticPointListView.as_view(), name='static-point-list'),

    # Server-Sent Events
    path('sse/', views.SSEStreamView.as_view(), name='sse-stream'),
]
