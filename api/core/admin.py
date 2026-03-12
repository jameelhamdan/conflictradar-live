from datetime import timedelta

from django.contrib import admin, messages
from django.shortcuts import redirect
from import_export import resources
from import_export.admin import ImportExportModelAdmin

from . import models


class SourceResource(resources.ModelResource):
    class Meta:
        model = models.Source
        fields = ("code", "type", "name", "description", "url", "author_slug", "is_enabled")
        import_id_fields = ("code",)


class ArticleResource(resources.ModelResource):
    class Meta:
        model = models.Article
        fields = (
            "id", "source_code", "source_type", "title", "content",
            "author", "published_on", "processed_on",
            "sentiment", "location", "latitude", "longitude",
            "event_intensity", "category", "sub_category",
        )
        import_id_fields = ("id",)


class EventResource(resources.ModelResource):
    class Meta:
        model = models.Event
        fields = (
            "id", "title", "location_name", "category", "sub_category",
            "latitude", "longitude", "started_at",
            "article_count", "avg_sentiment", "avg_intensity",
            "source_codes",
        )
        import_id_fields = ("id",)


@admin.register(models.Source)
class SourceAdmin(ImportExportModelAdmin):
    resource_classes = [SourceResource]
    list_display = ["code", "name", "type", "author_slug", "is_enabled", "created_on"]
    list_filter = ["type", "is_enabled"]
    search_fields = ["name", "code", "author_slug"]

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return [*self.readonly_fields, "code"]
        return self.readonly_fields


@admin.register(models.Article)
class ArticleAdmin(ImportExportModelAdmin):
    resource_classes = [ArticleResource]
    change_list_template = "admin/core/article/change_list.html"

    list_display = [
        "id",
        "title",
        "source_code",
        "source_type",
        "category",
        "sentiment",
        "location",
        "published_on",
        "processed_on",
    ]
    list_filter = ["source_type", "source_code", "category"]
    search_fields = ["title", "location", "category"]
    readonly_fields = [
        "id",
        "entities",
        "sentiment",
        "location",
        "event_intensity",
        "category",
        "latitude",
        "longitude",
        "processed_on",
        "created_on",
        "updated_on",
    ]

    def changelist_view(self, request, extra_context=None):
        if request.method == "POST" and "pipeline_action" in request.POST:
            return self._handle_pipeline_action(request)
        return super().changelist_view(request, extra_context=extra_context)

    def _handle_pipeline_action(self, request):
        from django.utils.timezone import now
        from services.tasks import aggregate_events_job, fetch_articles_job, process_articles_job

        action = request.POST["pipeline_action"]

        if action in ("fetch", "run_all"):
            hours = max(1, int(request.POST.get("fetch_hours") or 2))
            source_code = request.POST.get("fetch_source") or None
            start_date = now() - timedelta(hours=hours)
            fetch_articles_job.delay(source_code, start_date)
            self.message_user(request, f"Fetch job enqueued - {source_code}, last {hours}h.", messages.SUCCESS)

        if action in ("process", "run_all"):
            limit = max(1, int(request.POST.get("process_limit") or 500))
            process_articles_job.delay(limit=limit)
            self.message_user(request, f"Process job enqueued - limit {limit}.", messages.SUCCESS)

        if action in ("aggregate", "run_all"):
            hours = max(1, int(request.POST.get("aggregate_hours") or 24))
            aggregate_events_job.delay(hours=hours)
            self.message_user(request, f"Aggregate job enqueued - last {hours}h.", messages.SUCCESS)

        if action not in ("fetch", "process", "aggregate", "run_all"):
            self.message_user(request, f"Unknown action: {action}", messages.ERROR)

        return redirect(request.path)


@admin.register(models.Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "title",
        "location_name",
        "category",
        "article_count",
        "avg_sentiment",
        "avg_intensity",
        "started_at",
    ]
    list_filter = ["category"]
    search_fields = ["title", "location_name"]
    readonly_fields = [
        "article_count",
        "avg_sentiment",
        "avg_intensity",
        "article_ids",
        "source_codes",
        "created_on",
        "updated_on",
    ]


@admin.register(models.PriceTick)
class PriceTickAdmin(admin.ModelAdmin):
    list_display = ["symbol", "stream_key", "name", "value", "change_pct", "volume", "occurred_at"]
    list_filter = ["stream_key"]
    search_fields = ["symbol", "name"]
    readonly_fields = ["occurred_at"]


@admin.register(models.NotamRecord)
class NotamRecordAdmin(admin.ModelAdmin):
    list_display = [
        "notam_id", "notam_type", "status", "location_name",
        "country_code", "effective_from", "effective_to",
    ]
    list_filter = ["status", "notam_type", "source_region", "country_code"]
    search_fields = ["notam_id", "location_name", "country_code"]
    readonly_fields = ["notam_id", "geometry", "raw_text", "fetched_at"]


@admin.register(models.NotamZone)
class NotamZoneAdmin(admin.ModelAdmin):
    list_display = [
        "notam_id", "notam_type", "is_active", "location_name",
        "country_code", "effective_from", "effective_to", "updated_at",
    ]
    list_filter = ["is_active", "notam_type", "country_code"]
    search_fields = ["notam_id", "location_name"]
    readonly_fields = ["notam_id", "geometry", "updated_at"]


@admin.register(models.EarthquakeRecord)
class EarthquakeRecordAdmin(admin.ModelAdmin):
    list_display = [
        "usgs_id", "magnitude", "magnitude_type", "location_name",
        "alert_level", "tsunami_alert", "depth_km", "occurred_at",
    ]
    list_filter = ["alert_level", "tsunami_alert", "magnitude_type"]
    search_fields = ["usgs_id", "location_name"]
    readonly_fields = ["usgs_id", "fetched_at"]


@admin.register(models.StaticPoint)
class StaticPointAdmin(admin.ModelAdmin):
    list_display = ["code", "point_type", "name", "country", "country_code", "is_active"]
    list_filter = ["point_type", "is_active", "country_code"]
    search_fields = ["code", "name", "country"]

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return [*self.readonly_fields, "code"]
        return self.readonly_fields
