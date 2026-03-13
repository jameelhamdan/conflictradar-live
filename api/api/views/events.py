"""API views — events, sources, prices, NOTAMs, earthquakes, static points, SSE."""
import asyncio
import hashlib
import json
import os
import uuid
from datetime import datetime, timedelta, timezone as dt_timezone

import redis.asyncio as aioredis
from django.core.cache import caches
from django.http import StreamingHttpResponse
from django.views import View
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

_CACHE_TTL = 30  # seconds


def _redis_cache():
    return caches['redis-cache']

from core import models as core_models
from api.serializers import (
    ArticleSerializer, EventSerializer, SourceSerializer,
    PriceTickSerializer, NotamZoneSerializer, NotamRecordSerializer,
    EarthquakeRecordSerializer, StaticPointSerializer,
)


def _parse_dt(value: str) -> datetime:
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
    Query params: category, start, end, limit (max 500), bbox (lat_min,lng_min,lat_max,lng_max)
    """

    def get(self, request):
        params = dict(sorted(request.query_params.items()))
        cache_key = 'api:events:list:' + hashlib.md5(json.dumps(params).encode()).hexdigest()
        cache = _redis_cache()
        if (cached := cache.get(cache_key)) is not None:
            return Response(cached)

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
        source_map = {s.code: s.name for s in core_models.Source.objects.only('code', 'name')}
        data = {'results': EventSerializer(qs[:limit], many=True, context={'source_map': source_map}).data}
        data['count'] = len(data['results'])
        cache.set(cache_key, data, _CACHE_TTL)
        return Response(data)


class EventDetailView(APIView):
    """GET /api/events/<id>/"""

    def get(self, request, event_id):
        cache_key = f'api:events:detail:{event_id}'
        cache = _redis_cache()
        if (cached := cache.get(cache_key)) is not None:
            return Response(cached)

        try:
            event = core_models.Event.objects.get(pk=event_id)
        except core_models.Event.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        article_uuids = []
        for raw_id in event.article_ids:
            try:
                article_uuids.append(uuid.UUID(str(raw_id)))
            except (ValueError, AttributeError):
                pass

        articles = core_models.Article.objects.filter(id__in=article_uuids)
        source_map = {s.code: s.name for s in core_models.Source.objects.only('code', 'name')}
        data = EventSerializer(event, context={'source_map': source_map}).data
        data['articles'] = ArticleSerializer(articles, many=True).data
        cache.set(cache_key, data, _CACHE_TTL)
        return Response(data)


class SourceListView(APIView):
    """GET /api/sources/"""

    def get(self, request):
        cache = _redis_cache()
        if (cached := cache.get('api:sources:list')) is not None:
            return Response(cached)
        data = {'results': SourceSerializer(core_models.Source.objects.all(), many=True).data}
        cache.set('api:sources:list', data, _CACHE_TTL)
        return Response(data)


class PriceLatestView(APIView):
    """GET /api/prices/latest/ — most recent tick per symbol; query param: stream_key"""

    def get(self, request):
        qs = core_models.PriceTick.objects.all()
        if stream_key := request.query_params.get('stream_key'):
            qs = qs.filter(stream_key=stream_key)

        seen: set = set()
        latest = []
        for tick in qs:
            if tick.symbol not in seen:
                seen.add(tick.symbol)
                latest.append(tick)
            if len(seen) > 200:
                break

        return Response({'results': PriceTickSerializer(latest, many=True).data})


class PriceHistoryView(APIView):
    """GET /api/prices/<symbol>/ — query params: from, to, limit (max 5000)"""

    def get(self, request, symbol):
        qs = core_models.PriceTick.objects.filter(symbol=symbol)
        now = datetime.now(tz=dt_timezone.utc)

        try:
            start = _parse_dt(raw) if (raw := request.query_params.get('from')) else now - timedelta(hours=24)
        except ValueError:
            return Response({'error': 'Invalid from date'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            end = _parse_dt(raw) if (raw := request.query_params.get('to')) else now
        except ValueError:
            return Response({'error': 'Invalid to date'}, status=status.HTTP_400_BAD_REQUEST)

        qs = qs.filter(occurred_at__gte=start, occurred_at__lte=end)
        limit = _parse_int(request.query_params.get('limit'), 500, 5000)
        serializer = PriceTickSerializer(qs[:limit], many=True)
        return Response({'symbol': symbol, 'results': serializer.data, 'count': len(serializer.data)})


class NotamZoneListView(APIView):
    """GET /api/notams/ — query params: active (true/false/all), country_code, notam_type"""

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
    """GET /api/notams/history/ — query params: from, to, country_code, status, limit"""

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
    """GET /api/earthquakes/ — query params: min_magnitude, hours, limit"""

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
    """GET /api/static-points/ — query params: type, country_code"""

    def get(self, request):
        qs = core_models.StaticPoint.objects.filter(is_active=True)

        if point_type := request.query_params.get('type'):
            qs = qs.filter(point_type=point_type)
        if country_code := request.query_params.get('country_code'):
            qs = qs.filter(country_code__iexact=country_code)

        serializer = StaticPointSerializer(qs, many=True)
        return Response({'results': serializer.data, 'count': len(serializer.data)})


class SSEStreamView(View):
    """GET /api/sse/ — async Server-Sent Events from Redis pub/sub"""

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

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        response['Access-Control-Allow-Origin'] = '*'
        return response
