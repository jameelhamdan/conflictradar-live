"""LLM-based directional market forecast service."""

import json
import logging
import re
from datetime import datetime, timedelta, timezone as dt_timezone

logger = logging.getLogger(__name__)

# Default (symbol, stream_key) pairs to forecast
DEFAULT_SYMBOLS: list[tuple[str, str]] = [
    ('GC=F',     'commodity'),   # Gold
    ('CL=F',     'commodity'),   # Crude Oil
    ('NG=F',     'commodity'),   # Natural Gas
    ('ZW=F',     'commodity'),   # Wheat
    ('BTC-USD',  'crypto'),      # Bitcoin
    ('ETH-USD',  'crypto'),      # Ethereum
    ('SPY',      'stock'),       # S&P 500 ETF
    ('DX-Y.NYB', 'forex'),       # US Dollar Index
    ('^TNX',     'bond'),        # 10Y Treasury Yield
]

_JSON_RE = re.compile(r'\{.*?\}', re.DOTALL)


def run_forecasts(
    symbols: list[tuple[str, str]] | None = None,
    horizon_hours: int = 4,
) -> int:
    """Generate LLM forecasts for all symbols. Returns count of forecasts created."""
    from services.forecasting.features import build_feature_vector
    from services.llm import LLMError, get_llm_service
    from core import models as core_models

    if symbols is None:
        symbols = DEFAULT_SYMBOLS

    now = datetime.now(tz=dt_timezone.utc)
    created = 0

    try:
        llm = get_llm_service()
    except LLMError as e:
        logger.error('Cannot initialize LLM for forecasting: %s', e)
        return 0

    for symbol, stream_key in symbols:
        try:
            features = build_feature_vector(symbol, now)

            if features['current_price'] is None:
                logger.debug('No price data for %s — skipping', symbol)
                continue

            prompt = _build_prompt(symbol, features, horizon_hours)
            try:
                raw = llm.chat([{'role': 'user', 'content': prompt}], temperature=0.2)
            except LLMError as e:
                logger.warning('LLM forecast failed for %s: %s', symbol, e)
                continue

            result = _parse_response(raw)
            if result is None:
                logger.warning('Unparseable LLM response for %s: %s', symbol, raw[:200])
                continue

            # Store without routed_event_ids in feature_vector (stored separately)
            fv = {k: v for k, v in features.items() if k != 'routed_event_ids'}

            core_models.Forecast.objects.create(
                symbol=symbol,
                stream_key=stream_key,
                generated_at=now,
                horizon_hours=horizon_hours,
                direction=result['direction'],
                confidence=result['confidence'],
                model_name=getattr(llm, '_model', 'unknown'),
                reasoning=result.get('reasoning', ''),
                event_ids=features.get('routed_event_ids', []),
                feature_vector=fv,
            )
            created += 1
            logger.info('Forecast: %s → %s (conf=%.2f)', symbol, result['direction'], result['confidence'])

        except Exception:
            logger.exception('Unexpected error forecasting %s', symbol)

    return created


def score_forecasts() -> int:
    """Fill actual_value for forecasts whose horizon has elapsed. Returns count scored."""
    from core import models as core_models

    now = datetime.now(tz=dt_timezone.utc)
    scored = 0

    for forecast in core_models.Forecast.objects.filter(actual_value__isnull=True):
        horizon_end = forecast.generated_at + timedelta(hours=forecast.horizon_hours)
        if now < horizon_end:
            continue

        tick = (
            core_models.PriceTick.objects
            .filter(symbol=forecast.symbol, occurred_at__gte=horizon_end)
            .order_by('occurred_at')
            .first()
        )
        if tick is None:
            continue

        forecast.actual_value = tick.value
        forecast.save(update_fields=['actual_value'])
        scored += 1

    return scored


def _build_prompt(symbol: str, features: dict, horizon_hours: int) -> str:
    def fmt(v):
        return f'{v:.4f}' if v is not None else 'N/A'

    return f"""You are a quantitative analyst. Based on real-time data, forecast {symbol} direction over the next {horizon_hours} hours.

Current price: {fmt(features.get('current_price'))}
1h momentum: {fmt(features.get('price_momentum_1h'))}
24h momentum: {fmt(features.get('price_momentum_24h'))}
Events affecting {symbol} (last 24h): {features.get('routed_event_count', 0)}
Avg news sentiment: {fmt(features.get('news_sentiment_mean'))} (−1 bearish → +1 bullish)
Max event intensity: {fmt(features.get('event_intensity_max'))}
Events by category: {json.dumps(features.get('event_count_by_category', {}))}

Respond with JSON only (no markdown):
{{"direction": "up"|"down"|"neutral", "confidence": 0.0-1.0, "reasoning": "one sentence"}}"""


def _parse_response(raw: str) -> dict | None:
    match = _JSON_RE.search(raw)
    if not match:
        return None
    try:
        data = json.loads(match.group())
    except (json.JSONDecodeError, ValueError):
        return None

    direction = str(data.get('direction', '')).lower()
    if direction not in ('up', 'down', 'neutral'):
        return None

    try:
        confidence = max(0.0, min(1.0, float(data.get('confidence', 0.5))))
    except (TypeError, ValueError):
        confidence = 0.5

    return {
        'direction':  direction,
        'confidence': confidence,
        'reasoning':  str(data.get('reasoning', '')),
    }
