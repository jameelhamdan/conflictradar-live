"""Feature vector builder for (symbol, at_time)."""

import logging
from datetime import datetime, timedelta, timezone as dt_timezone

logger = logging.getLogger(__name__)


def build_feature_vector(symbol: str, at_time: datetime, window_hours: int = 24) -> dict:
    """
    Build a feature dict for (symbol, at_time) from the window [at_time - window_hours, at_time].
    """
    from core import models as core_models
    from services.forecasting.routing import route_event_to_symbols

    if at_time.tzinfo is None:
        at_time = at_time.replace(tzinfo=dt_timezone.utc)

    window_start = at_time - timedelta(hours=window_hours)

    # ── Price features ────────────────────────────────────────────────────────
    price_qs = (
        core_models.PriceTick.objects
        .filter(symbol=symbol, occurred_at__gte=window_start, occurred_at__lte=at_time)
        .order_by('occurred_at')
    )
    prices = list(price_qs.values_list('value', 'occurred_at'))

    current_price = prices[-1][0] if prices else None

    price_1h_ago = None
    if prices:
        cutoff_1h = at_time - timedelta(hours=1)
        for val, ts in reversed(prices):
            if ts <= cutoff_1h:
                price_1h_ago = val
                break

    price_momentum_1h = None
    price_momentum_24h = None
    if current_price and price_1h_ago:
        price_momentum_1h = (current_price - price_1h_ago) / price_1h_ago
    if current_price and prices:
        oldest = prices[0][0]
        if oldest:
            price_momentum_24h = (current_price - oldest) / oldest

    # ── Event / news features ─────────────────────────────────────────────────
    events = list(
        core_models.Event.objects
        .filter(started_at__gte=window_start, started_at__lte=at_time)
        .values('id', 'category', 'avg_sentiment', 'avg_intensity', 'topic_slugs', 'location_name')
    )

    sentiments  = [e['avg_sentiment']  for e in events if e['avg_sentiment']  is not None]
    intensities = [e['avg_intensity']  for e in events if e['avg_intensity']  is not None]

    category_counts: dict[str, int] = {}
    for e in events:
        cat = e.get('category') or 'general'
        category_counts[cat] = category_counts.get(cat, 0) + 1

    routed_event_ids: list[str] = []
    for e in events:
        syms = route_event_to_symbols(
            e.get('category', ''),
            e.get('location_name', ''),
            e.get('topic_slugs') or [],
        )
        if symbol in syms:
            routed_event_ids.append(str(e['id']))

    return {
        'symbol':                  symbol,
        'at_time':                 at_time.isoformat(),
        'window_hours':            window_hours,
        'current_price':           current_price,
        'price_momentum_1h':       price_momentum_1h,
        'price_momentum_24h':      price_momentum_24h,
        'event_count':             len(events),
        'routed_event_count':      len(routed_event_ids),
        'routed_event_ids':        routed_event_ids,
        'news_sentiment_mean':     sum(sentiments) / len(sentiments) if sentiments else None,
        'news_sentiment_std':      _std(sentiments),
        'event_intensity_max':     max(intensities) if intensities else None,
        'event_intensity_mean':    sum(intensities) / len(intensities) if intensities else None,
        'event_count_by_category': category_counts,
    }


def _std(values: list[float]) -> float | None:
    if len(values) < 2:
        return None
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    return variance ** 0.5
