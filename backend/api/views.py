"""
REST API views for the live event map frontend.

Endpoints:
  GET /api/events/              — list events with optional filters
  GET /api/events/<id>/         — single event with its articles
  GET /api/sources/             — list configured sources
  GET /api/prices/latest/       — latest price tick per symbol
  GET /api/prices/<symbol>/     — price history for one symbol
  GET /api/notams/              — active NOTAM zones (GeoJSON)
  GET /api/notams/history/      — NOTAM alert history
  GET /api/earthquakes/         — recent earthquake records
  GET /api/static-points/       — static reference points (exchanges, ports, etc.)
  GET /api/sse/                 — Server-Sent Events stream
"""
import asyncio
import os
import uuid
from datetime import datetime, timedelta, timezone as dt_timezone

import redis.asyncio as aioredis
from django.http import StreamingHttpResponse
from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core import models as core_models
from .serializers import (
    ArticleSerializer, EventSerializer, SourceSerializer,
    PriceTickSerializer, NotamZoneSerializer, NotamRecordSerializer,
    EarthquakeRecordSerializer, StaticPointSerializer,
)


def _parse_dt(value: str) -> datetime:
    """Parse an ISO datetime string and ensure it is UTC-aware.

    .replace() would silently overwrite an existing timezone on tz-aware strings;
    .astimezone() converts correctly in both cases.
    """
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=dt_timezone.utc)
    return dt.astimezone(dt_timezone.utc)


def _parse_int(value: str | None, default: int, max_value: int | None = None) -> int:
    try:
        result = int(value) if value is not None else default
    except (ValueError, TypeError):
        result = default
    return min(result, max_value) if max_value is not None else result


class EventListView(APIView):
    """
    GET /api/events/

    Query params:
      category  — filter by category slug (e.g. conflict)
      start     — ISO datetime lower bound for started_at
      end       — ISO datetime upper bound for started_at
      limit     — max results (default 100, max 500)
      bbox      — comma-separated lat_min,lng_min,lat_max,lng_max
    """

    def get(self, request):
        qs = core_models.Event.objects.all()

        if category := request.query_params.get('category'):
            qs = qs.filter(category=category)

        if start := request.query_params.get('start'):
            try:
                qs = qs.filter(started_at__gte=_parse_dt(start))
            except ValueError:
                return Response({'error': 'Invalid start date'}, status=status.HTTP_400_BAD_REQUEST)

        if end := request.query_params.get('end'):
            try:
                qs = qs.filter(started_at__lte=_parse_dt(end))
            except ValueError:
                return Response({'error': 'Invalid end date'}, status=status.HTTP_400_BAD_REQUEST)

        if bbox := request.query_params.get('bbox'):
            try:
                lat_min, lng_min, lat_max, lng_max = (float(v) for v in bbox.split(','))
                qs = qs.filter(
                    latitude__gte=lat_min, latitude__lte=lat_max,
                    longitude__gte=lng_min, longitude__lte=lng_max,
                )
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid bbox. Use: lat_min,lng_min,lat_max,lng_max'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        limit = _parse_int(request.query_params.get('limit'), 100, 500)
        serializer = EventSerializer(qs[:limit], many=True)
        return Response({'results': serializer.data, 'count': len(serializer.data)})


class EventDetailView(APIView):
    """
    GET /api/events/<id>/

    Returns the event plus its full article list.
    """

    def get(self, request, event_id):
        try:
            event = core_models.Event.objects.get(pk=event_id)
        except core_models.Event.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        # article_ids are stored as strings; convert to UUIDs for the ORM filter
        article_uuids = []
        for raw_id in event.article_ids:
            try:
                article_uuids.append(uuid.UUID(str(raw_id)))
            except (ValueError, AttributeError):
                pass

        articles = core_models.Article.objects.filter(id__in=article_uuids)

        data = EventSerializer(event).data
        data['articles'] = ArticleSerializer(articles, many=True).data
        return Response(data)


class SourceListView(APIView):
    """GET /api/sources/"""

    def get(self, request):
        sources = core_models.Source.objects.all()
        serializer = SourceSerializer(sources, many=True)
        return Response({'results': serializer.data})


class PriceLatestView(APIView):
    """
    GET /api/prices/latest/

    Returns the most recent price tick for every known symbol, grouped by stream_key.
    Query params:
      stream_key — filter by category ("stock", "crypto", "commodity", "forex", "bond")
    """

    def get(self, request):
        qs = core_models.PriceTick.objects.all()
        if stream_key := request.query_params.get('stream_key'):
            qs = qs.filter(stream_key=stream_key)

        # Collect latest tick per symbol (queryset is ordered by -occurred_at)
        seen = set()
        latest = []
        for tick in qs:
            if tick.symbol not in seen:
                seen.add(tick.symbol)
                latest.append(tick)
            if len(seen) > 200:
                break

        serializer = PriceTickSerializer(latest, many=True)
        return Response({'results': serializer.data})


class PriceHistoryView(APIView):
    """
    GET /api/prices/<symbol>/

    Returns price history for one symbol.
    Query params:
      from    — ISO datetime lower bound (default: 24h ago)
      to      — ISO datetime upper bound (default: now)
      limit   — max records (default 500, max 5000)
    """

    def get(self, request, symbol):
        qs = core_models.PriceTick.objects.filter(symbol=symbol)

        now = datetime.now(tz=dt_timezone.utc)
        try:
            start = _parse_dt(raw_from) if (raw_from := request.query_params.get('from')) else now - timedelta(hours=24)
        except ValueError:
            return Response({'error': 'Invalid from date'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            end = _parse_dt(raw_to) if (raw_to := request.query_params.get('to')) else now
        except ValueError:
            return Response({'error': 'Invalid to date'}, status=status.HTTP_400_BAD_REQUEST)

        qs = qs.filter(occurred_at__gte=start, occurred_at__lte=end)
        limit = _parse_int(request.query_params.get('limit'), 500, 5000)

        serializer = PriceTickSerializer(qs[:limit], many=True)
        return Response({'symbol': symbol, 'results': serializer.data, 'count': len(serializer.data)})


class NotamZoneListView(APIView):
    """
    GET /api/notams/

    Returns current active NOTAM zones (is_active=True by default).
    Query params:
      active         — "true" (default) or "false" or "all"
      country_code   — filter by 2-letter ICAO country code
      notam_type     — filter by type (TFR, prohibited, restricted, danger, ...)
    """

    def get(self, request):
        qs = core_models.NotamZone.objects.all()

        active_param = request.query_params.get('active', 'true').lower()
        if active_param == 'true':
            qs = qs.filter(is_active=True)
        elif active_param == 'false':
            qs = qs.filter(is_active=False)

        if country_code := request.query_params.get('country_code'):
            qs = qs.filter(country_code__iexact=country_code)

        if notam_type := request.query_params.get('notam_type'):
            qs = qs.filter(notam_type__iexact=notam_type)

        serializer = NotamZoneSerializer(qs[:1000], many=True)
        return Response({'results': serializer.data, 'count': len(serializer.data)})


class NotamHistoryView(APIView):
    """
    GET /api/notams/history/

    Returns NOTAM alert history.
    Query params:
      from, to, country_code, status, limit
    """

    def get(self, request):
        qs = core_models.NotamRecord.objects.all()

        if country_code := request.query_params.get('country_code'):
            qs = qs.filter(country_code__iexact=country_code)

        if notam_status := request.query_params.get('status'):
            qs = qs.filter(status=notam_status)

        if from_dt := request.query_params.get('from'):
            try:
                qs = qs.filter(effective_from__gte=_parse_dt(from_dt))
            except ValueError:
                return Response({'error': 'Invalid from date'}, status=status.HTTP_400_BAD_REQUEST)

        if to_dt := request.query_params.get('to'):
            try:
                qs = qs.filter(effective_from__lte=_parse_dt(to_dt))
            except ValueError:
                return Response({'error': 'Invalid to date'}, status=status.HTTP_400_BAD_REQUEST)

        limit = _parse_int(request.query_params.get('limit'), 200, 2000)

        serializer = NotamRecordSerializer(qs[:limit], many=True)
        return Response({'results': serializer.data, 'count': len(serializer.data)})


class EarthquakeListView(APIView):
    """
    GET /api/earthquakes/

    Query params:
      min_magnitude  — float (default 3.0)
      hours          — look back N hours (default 24)
      limit          — max records (default 200, max 2000)
    """

    def get(self, request):
        try:
            min_mag = float(request.query_params.get('min_magnitude', '3.0'))
        except ValueError:
            min_mag = 3.0

        hours = _parse_int(request.query_params.get('hours'), 24)
        limit = _parse_int(request.query_params.get('limit'), 200, 2000)

        cutoff = datetime.now(tz=dt_timezone.utc) - timedelta(hours=hours)
        qs = core_models.EarthquakeRecord.objects.filter(
            magnitude__gte=min_mag,
            occurred_at__gte=cutoff,
        )

        serializer = EarthquakeRecordSerializer(qs[:limit], many=True)
        return Response({'results': serializer.data, 'count': len(serializer.data)})


class StaticPointListView(APIView):
    """
    GET /api/static-points/

    Query params:
      type          — point_type slug (exchange, commodity_exchange, port, central_bank)
      country_code  — ISO 2-letter code
    """

    def get(self, request):
        qs = core_models.StaticPoint.objects.filter(is_active=True)

        if point_type := request.query_params.get('type'):
            qs = qs.filter(point_type=point_type)

        if country_code := request.query_params.get('country_code'):
            qs = qs.filter(country_code__iexact=country_code)

        serializer = StaticPointSerializer(qs, many=True)
        return Response({'results': serializer.data, 'count': len(serializer.data)})


class SSEStreamView(View):
    """
    GET /api/sse/

    Async Server-Sent Events endpoint. Each connection holds an async task
    subscribed to Redis pub/sub — no thread pool slots are consumed.

    Frontend connects via:
        const es = new EventSource('/api/sse/');
        es.onmessage = (e) => { const data = JSON.parse(e.data); ... };
    """

    SSE_CHANNELS = ('sse:stream', 'sse:prices', 'sse:notams', 'sse:earthquakes')

    async def get(self, request):
        redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

        async def event_stream():
            r = aioredis.from_url(redis_url)
            pubsub = r.pubsub()
            await pubsub.subscribe(*self.SSE_CHANNELS)
            yield 'data: {"type":"connected"}\n\n'
            try:
                async for message in pubsub.listen():
                    if message['type'] == 'message':
                        raw = message['data']
                        payload = raw.decode() if isinstance(raw, bytes) else raw
                        yield f'data: {payload}\n\n'
            except (asyncio.CancelledError, GeneratorExit):
                pass
            finally:
                await pubsub.unsubscribe(*self.SSE_CHANNELS)
                await r.aclose()

        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream',
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        response['Access-Control-Allow-Origin'] = '*'
        return response
