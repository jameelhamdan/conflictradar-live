from api.views.events import (
    EventListView,
    EventDetailView,
    SourceListView,
    PriceLatestView,
    PriceHistoryView,
    NotamZoneListView,
    NotamHistoryView,
    EarthquakeListView,
    StaticPointListView,
    SSEStreamView,
)
from api.views.newsletter import (
    SubscribeView,
    ConfirmView,
    UnsubscribeView,
    NewsletterListView,
    NewsletterDetailView,
)

__all__ = [
    'EventListView', 'EventDetailView', 'SourceListView',
    'PriceLatestView', 'PriceHistoryView',
    'NotamZoneListView', 'NotamHistoryView',
    'EarthquakeListView', 'StaticPointListView',
    'SSEStreamView',
    'SubscribeView', 'ConfirmView', 'UnsubscribeView',
    'NewsletterListView', 'NewsletterDetailView',
]
