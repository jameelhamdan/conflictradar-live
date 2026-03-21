"""Forecast API views."""

from datetime import datetime, timedelta, timezone as dt_timezone

from rest_framework.response import Response
from rest_framework.views import APIView

from core import models as core_models
from api.serializers import ForecastSerializer


def _parse_int(value, default: int, max_value: int | None = None) -> int:
    try:
        result = int(value) if value is not None else default
    except (ValueError, TypeError):
        result = default
    return min(result, max_value) if max_value is not None else result


class ForecastListView(APIView):
    """
    GET /api/forecasts/
    Query params: symbol, stream_key, horizon (hours, default 4), limit (max 200, default 20)
    """
    def get(self, request):
        qs = core_models.Forecast.objects.all()

        if symbol := request.query_params.get('symbol'):
            qs = qs.filter(symbol=symbol)

        if stream_key := request.query_params.get('stream_key'):
            qs = qs.filter(stream_key=stream_key)

        if horizon := request.query_params.get('horizon'):
            try:
                qs = qs.filter(horizon_hours=int(horizon))
            except (ValueError, TypeError):
                pass

        limit = _parse_int(request.query_params.get('limit'), 20, 200)
        data = {'results': ForecastSerializer(qs[:limit], many=True).data}
        data['count'] = len(data['results'])
        return Response(data)


class ForecastLatestView(APIView):
    """
    GET /api/forecasts/latest/
    Returns the most recent forecast per symbol.
    Query params: stream_key
    """

    def get(self, request):
        qs = core_models.Forecast.objects.all()

        if stream_key := request.query_params.get('stream_key'):
            qs = qs.filter(stream_key=stream_key)

        seen: set[str] = set()
        latest: list = []
        for fc in qs:
            if fc.symbol not in seen:
                seen.add(fc.symbol)
                latest.append(fc)
            if len(seen) >= 50:
                break

        data = {'results': ForecastSerializer(latest, many=True).data}
        data['count'] = len(data['results'])
        return Response(data)
