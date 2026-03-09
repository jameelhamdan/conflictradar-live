"""
Background task functions for the pipeline.

Tasks are plain callables — enqueue them directly with RQ:
    django_rq.get_queue('default').enqueue(Workflow.fetch_articles, source_code, start_date)

The management commands (fetch_data, process_articles, aggregate_events) are
thin wrappers that parse CLI args and call or enqueue these functions.
"""
import logging
import re
import requests
from collections import defaultdict
from datetime import datetime, timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)


def _fetch_og_image(url: str) -> str | None:
    """Best-effort: fetch og:image meta tag from a URL. Returns None on any failure."""
    try:
        r = requests.get(url, timeout=5, headers={'User-Agent': 'Mozilla/5.0'}, stream=True)
        # Read only the first 64 KB — enough to find the <head> og:image tag
        chunk = next(r.iter_content(65536), b'')
        r.close()
        text = chunk.decode('utf-8', errors='ignore')
        m = re.search(
            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',
            text,
        ) or re.search(
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
            text,
        )
        return m.group(1).strip() if m else None
    except Exception:
        return None


class Workflow:
    @classmethod
    def fetch_articles(cls, source_code: str | None, start_date: datetime) -> int:
        """
        Fetch messages from one or all sources starting at start_date and save as Articles.
        Returns the total number of newly created articles.
        """
        from services.data import DataService
        from core.models import Source

        sources = (
            list(Source.objects.filter(code=source_code))
            if source_code
            else list(Source.objects.filter(is_enabled=True))
        )
        total = 0
        for source in sources:
            try:
                count = DataService(source).refresh_until(start_date)
                total += count
            except Exception as e:
                count = 0
                logger.error(f'[fetch] Exception - {e}', exc_info=e)
            logger.info(f'[fetch] {source.code}: {count} new article(s)')
        logger.info(f'[fetch] done — {total} new article(s) across {len(sources)} source(s)')
        return total

    @classmethod
    def process_articles(
        cls,
        limit: int = 500,
        source_code: str | None = None,
        reprocess: bool = False,
    ) -> int:
        """
        Step 2 — Clean: run HuggingFace NER + VADER sentiment on Articles; use LLM for category + location.
        Returns the number of articles processed.
        """
        from core.models import Article, ArticleDocument
        from services.processing.cleaner import ArticleCleaner, CleaningError

        qs = Article.objects.all()
        if source_code:
            qs = qs.filter(source_code=source_code)
        if not reprocess:
            qs = qs.filter(processed_on__isnull=True)
        articles = list(qs[:limit])

        if not articles:
            return 0

        try:
            cleaner = ArticleCleaner()
        except CleaningError:
            logger.exception('NLP pipeline failed')
            raise

        processed = 0
        for article in articles:
            doc = ArticleDocument(
                id=str(article.id),
                title=article.title,
                content=article.content,
                source_code=article.source_code,
                published_on=article.published_on.isoformat(),
            )
            features = cleaner.clean(doc)
            article.entities = features.entities
            article.sentiment = features.sentiment
            article.location = features.location
            article.latitude = features.latitude
            article.longitude = features.longitude
            article.event_intensity = features.event_intensity
            article.category = features.category
            article.sub_category = features.sub_category
            article.processed_on = timezone.now()
            article.extra_data = {**(article.extra_data or {}), 'llm': features.llm_data}
            article.translations = features.translations

            # Best-effort: fetch og:image if no banner set yet and URL is reachable
            update_fields = [
                'entities', 'sentiment', 'location', 'latitude', 'longitude',
                'event_intensity', 'category', 'sub_category', 'processed_on',
                'extra_data', 'translations',
            ]
            if not article.banner_image_url and article.source_url and article.source_url.startswith('https://'):
                og = _fetch_og_image(article.source_url)
                if og:
                    article.banner_image_url = og
                    update_fields.append('banner_image_url')

            article.save(update_fields=update_fields)
            processed += 1
            location = features.location or '?'
            category = '/'.join(filter(None, [features.category, features.sub_category]))
            logger.info(f'[process] {article.title[:70]} → {category} @ {location}')

        return processed

    @classmethod
    def aggregate_events(cls, hours: int = 24, min_articles: int = 1) -> tuple[int, int]:
        """
        Group processed Articles by (location, calendar day) into Events.
        Uses lat/lng stored by the geocoder during process_articles.
        Returns (created_count, updated_count).
        """
        from core.models import Article, Event

        lookback = timezone.now() - timedelta(hours=hours)
        articles = list(
            Article.objects.filter(
                processed_on__isnull=False,
                location__isnull=False,
                published_on__gte=lookback,
            ).exclude(location='')
        )

        if not articles:
            return 0, 0

        # Group by (city, country, calendar day) from LLM data — more stable than the
        # concatenated location string which can vary slightly between articles.
        buckets: dict[tuple[str, str, str], list] = defaultdict(list)
        for article in articles:
            llm = (article.extra_data or {}).get('llm', {})
            city = llm.get('city') or ''
            country = llm.get('country') or ''
            date_key = article.published_on.date().isoformat()
            buckets[(city, country, date_key)].append(article)

        created_count = updated_count = 0

        for key, group in buckets.items():
            city, country = key[0], key[1]
            if len(group) < min_articles:
                continue

            location = ', '.join(filter(None, [city, country])) or (group[0].location or '')
            if not location:
                continue

            representative = max(group, key=lambda a: a.event_intensity or 0)
            sentiments = [a.sentiment for a in group if a.sentiment is not None]
            intensities = [a.event_intensity for a in group if a.event_intensity is not None]
            avg_sentiment = round(sum(sentiments) / len(sentiments), 4) if sentiments else None
            base_intensity = round(sum(intensities) / len(intensities), 4) if intensities else None
            # Corroboration boost: more articles covering the same event → higher importance.
            # Saturates at 10 articles (+0.3 max), capped at 1.0.
            corroboration_boost = min(len(group) / 10.0, 1.0) * 0.3
            avg_intensity = round(min((base_intensity or 0) + corroboration_boost, 1.0), 4) if base_intensity is not None else None

            started_at = min(a.published_on for a in group)
            article_ids = [str(a.id) for a in group]
            source_codes = list({a.source_code for a in group})

            categories = [a.category for a in group if a.category]
            category = max(set(categories), key=categories.count) if categories else 'general'
            sub_categories = sorted({a.sub_category for a in group if a.sub_category})

            # Average lat/lon across all articles that have coordinates
            lats = [a.latitude for a in group if a.latitude is not None]
            lngs = [a.longitude for a in group if a.longitude is not None]
            lat = round(sum(lats) / len(lats), 6) if lats else representative.latitude
            lng = round(sum(lngs) / len(lngs), 6) if lngs else representative.longitude

            # Build event translations subdocument from representative article.
            # For each language in the representative's translations, copy the title
            # and build location_name from city + country in that language.
            rep_translations = getattr(representative, 'translations', {}) or {}
            event_translations: dict = {}
            for lang, fields in rep_translations.items():
                if not isinstance(fields, dict):
                    continue
                lang_city = fields.get('city') or ''
                lang_country = fields.get('country') or ''
                lang_location = ', '.join(p for p in [lang_city, lang_country] if p) or location
                event_translations[lang] = {
                    'title': fields.get('title') or representative.title,
                    'location_name': lang_location,
                }

            # Upsert: match on location_name + calendar day.
            # Use explicit datetime range — MongoDB backend does not support __date lookups.
            day_start = datetime(started_at.year, started_at.month, started_at.day, tzinfo=started_at.tzinfo)
            day_end = day_start + timedelta(days=1)

            event = Event.objects.filter(
                location_name=location,
                started_at__gte=day_start,
                started_at__lt=day_end,
            ).first()

            if event is None:
                Event.objects.create(
                    title=representative.title,
                    content=representative.content,
                    category=category,
                    location_name=location,
                    latitude=lat,
                    longitude=lng,
                    started_at=started_at,
                    article_count=len(group),
                    avg_sentiment=avg_sentiment,
                    avg_intensity=avg_intensity,
                    article_ids=article_ids,
                    source_codes=source_codes,
                    sub_categories=sub_categories,
                    translations=event_translations,
                )
                created_count += 1
                logger.info(f'[aggregate] Created  {location} [{category}] — {len(group)} article(s)')
            else:
                event.title = representative.title
                event.category = category
                event.latitude = lat
                event.longitude = lng
                event.article_count = len(group)
                event.avg_sentiment = avg_sentiment
                event.avg_intensity = avg_intensity
                event.article_ids = article_ids
                event.source_codes = source_codes
                event.sub_categories = sub_categories
                event.translations = event_translations
                event.save()
                updated_count += 1
                logger.info(f'[aggregate] Updated  {location} [{category}] — {len(group)} article(s)')

        return created_count, updated_count

