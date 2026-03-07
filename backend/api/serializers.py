from rest_framework import serializers
from core.models import (
    Article, Event, Source,
    PriceTick, NotamRecord, NotamZone, EarthquakeRecord, StaticPoint,
)
from newsletter.models import DailyNewsletter


class ArticleSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Article
        fields = [
            'id',
            'title',
            'source_code',
            'source_url',
            'category',
            'sentiment',
            'location',
            'published_on',
        ]


class EventSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'category',
            'location_name',
            'latitude',
            'longitude',
            'started_at',
            'article_count',
            'avg_sentiment',
            'avg_intensity',
            'source_codes',
        ]


class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = ['code', 'name', 'type', 'url']


class PriceTickSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = PriceTick
        fields = ['id', 'symbol', 'stream_key', 'name', 'value', 'change_pct', 'volume', 'occurred_at']


class NotamRecordSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = NotamRecord
        fields = [
            'id', 'notam_id', 'source_region', 'notam_type', 'status',
            'effective_from', 'effective_to', 'geometry',
            'altitude_min_ft', 'altitude_max_ft',
            'location_name', 'country_code', 'raw_text', 'fetched_at',
        ]


class NotamZoneSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = NotamZone
        fields = [
            'id', 'notam_id', 'notam_type', 'geometry', 'is_active',
            'effective_from', 'effective_to',
            'altitude_min_ft', 'altitude_max_ft',
            'location_name', 'country_code', 'updated_at',
        ]


class EarthquakeRecordSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = EarthquakeRecord
        fields = [
            'id', 'usgs_id', 'magnitude', 'magnitude_type', 'depth_km',
            'location_name', 'latitude', 'longitude', 'occurred_at',
            'tsunami_alert', 'alert_level',
        ]


class StaticPointSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = StaticPoint
        fields = [
            'id', 'code', 'point_type', 'name', 'country', 'country_code',
            'latitude', 'longitude', 'metadata', 'is_active',
        ]


class NewsletterListSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = DailyNewsletter
        fields = ['id', 'date', 'subject', 'sent_at', 'event_count', 'status']


class NewsletterDetailSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = DailyNewsletter
        fields = ['id', 'date', 'subject', 'html_body', 'text_body', 'generated_at',
                  'sent_at', 'sent_count', 'event_count', 'status']


class SubscribeSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)

    def validate_email(self, value):
        return value.lower().strip()
