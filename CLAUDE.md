# CLAUDE.md — Happinga-Meter Dev Guide

This file gives Claude everything needed to write correct, consistent code for this project without re-reading the codebase from scratch each session.

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | Django 6 + django-mongodb-backend |
| Task queue | django-rq + Redis |
| Scheduling | rq-scheduler (`setup_schedule` management command) |
| Storage | MongoDB 8 |
| Ingestion | Telethon (Telegram) + requests |
| NLP | sentence-transformers + VADER + geopy |
| Frontend | React 19 + Waku + react-leaflet (TypeScript) |
| Serving | uvicorn (backend) + nginx reverse proxy |
| Containers | Docker Compose |

---

## Directory Map

> Ignore `__pycache__/` and `*.pyc` files everywhere — they are Python bytecode caches, not source.

```
./
├── api/                    # All Django/Python source (Docker build context: ./api, PYTHONPATH=/app)
│   ├── app/                # WSGI/ASGI entry, URLs, middleware, auth backend
│   │   ├── __init__.py     # Version string + build tag
│   │   ├── celery.py       # Stub (Celery removed — queue is django-rq)
│   │   ├── asgi.py         # ASGI application entry point
│   │   ├── urls.py         # Root URLconf — admin/ + api/
│   │   ├── backends.py     # ModelAuthBackend (respects user.can_login)
│   │   └── middleware.py   # X-App-Version header
│   ├── apps.py             # MongoAdminConfig, MongoAuthConfig, MongoContentTypesConfig
│   ├── core/               # Django app — data models + management commands
│   │   ├── apps.py         # name='core', label='core'
│   │   ├── models.py       # Source, Article, Event, Topic, PriceTick, NotamZone,
│   │   │                   # EarthquakeRecord, StaticPoint, Forecast
│   │   ├── admin.py        # Admin for all core models
│   │   └── management/commands/
│   │       ├── fetch_data.py           # Enqueues fetch_articles_task
│   │       ├── process_articles.py     # Enqueues process_articles_task
│   │       ├── aggregate_events.py     # Enqueues aggregate_events_task
│   │       ├── refresh_topics.py       # Enqueues refresh_topics_task
│   │       ├── tag_topics.py           # Enqueues tag_topics_task
│   │       ├── retroactive_tag_topic.py # Enqueues retroactive_tag_topic_task
│   │       ├── setup_schedule.py       # Registers all periodic jobs with rq-scheduler
│   │       └── e2e_pipeline.py         # End-to-end pipeline test → JSON report
│   ├── accounts/           # Custom User model + Session + Group proxies
│   │   ├── apps.py         # name='accounts', label='accounts'
│   │   ├── models.py       # User (email-based), UserManager
│   │   └── admin.py
│   ├── api/                # DRF REST API
│   │   ├── apps.py         # name='api', label='api'
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views/          # EventListView, EventDetailView, TopicListView, etc.
│   ├── newsletter/         # Django app — newsletter models + admin + tasks
│   │   ├── models.py       # DailyNewsletter
│   │   ├── admin.py
│   │   ├── tasks.py        # generate_newsletter_task, send_newsletter_task
│   │   └── management/commands/
│   ├── services/           # Stateless Python services (no Django models)
│   │   ├── tasks.py        # All task functions (plain Python — no decorator)
│   │   ├── queue.py        # enqueue() helper — wraps django-rq; sync fallback in dev
│   │   ├── workflow.py     # Workflow class — orchestrates pipeline steps
│   │   ├── processing/     # NLP processing pipeline
│   │   │   ├── analyzer.py     # Article analysis (NER, sentiment, geocoding)
│   │   │   ├── cleaner.py      # Text cleaning
│   │   │   └── clustering.py   # SemanticClusterer — sentence-transformers
│   │   ├── topics/         # Topic management
│   │   │   ├── matcher.py      # TopicMatcher (keyword) + LLMTopicMatcher (batch LLM)
│   │   │   ├── scraper.py      # Orchestrates source adapters; TOPIC_SOURCES env var
│   │   │   ├── dedup.py        # Deduplication + semantic_merge_topics
│   │   │   ├── types.py        # TopicDict TypedDict
│   │   │   ├── _dates.py       # Date helpers — parses "March 2025" and "2022"
│   │   │   └── sources/        # Per-source adapters
│   │   │       ├── ongoing.py          # WikipediaOngoingConflictsAdapter (~30–60 named conflicts)
│   │   │       └── current_situations.py # WikipediaCurrentSituationsAdapter (7-day prefix extraction)
│   │   ├── streams/        # Real-time data streams (prices, NOTAM, earthquakes, forex)
│   │   ├── data/           # Ingestion — DataService, ArticleDatum
│   │   │   ├── __init__.py     # exports DataService
│   │   │   ├── base.py         # ArticleDatum TypedDict
│   │   │   └── sources/        # Per-source scrapers
│   │   ├── forecasting/    # LLM market forecasting
│   │   │   ├── service.py      # run_forecasts(), score_forecasts()
│   │   │   ├── features.py     # build_feature_vector() — price + news features
│   │   │   └── routing.py      # route_event_to_symbols() — maps events to symbols
│   │   ├── newsletter/     # Newsletter generation + sending
│   │   │   ├── generator.py    # generate_newsletter() — LLM-based section writer
│   │   │   └── sender.py       # send_newsletter() — Markdown→HTML, SES
│   │   ├── email/          # Email delivery helpers
│   │   └── llm.py          # LLM client wrapper
│   ├── migrations/         # All app migrations (centralized, mapped via MIGRATION_MODULES)
│   │   ├── accounts/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── contenttypes/
│   │   ├── core/
│   │   ├── misc/
│   │   └── newsletter/
│   ├── settings/
│   │   └── base.py         # All config — DB, cache, RQ_QUEUES, auth, logging
│   ├── templates/
│   │   ├── admin/core/
│   │   └── admin/misc/
│   │       └── celery_monitor.html  # Django admin queue monitor (RQ workers/jobs)
│   ├── manage.py           # Django CLI
│   ├── requirements.txt
│   ├── release.sh          # collectstatic + migrate (run by Docker on api startup)
│   └── Dockerfile
├── ui/                     # React 19 + Waku SPA (TypeScript)
│   ├── src/
│   │   ├── pages/          # Waku file-based routes
│   │   │   └── index.tsx   # Main map page — activeTopic state, TopicsPanel + EventList
│   │   ├── api/            # Typed API client modules
│   │   │   ├── events.ts   # fetchEvents(), fetchEventDetail()
│   │   │   ├── newsletter.ts
│   │   │   ├── streams.ts
│   │   │   └── topics.ts   # fetchTopics(), fetchTopicDetail()
│   │   ├── components/
│   │   │   ├── events/
│   │   │   │   ├── EventCard.tsx     # Topic badges; onTopicClick prop
│   │   │   │   ├── EventList.tsx     # Passes topic props down
│   │   │   │   ├── EventUI.tsx
│   │   │   │   ├── ForecastPanel.tsx # LLM market forecast display
│   │   │   │   └── MapView.tsx       # L.divIcon category markers
│   │   │   └── topics/
│   │   │       └── TopicsPanel.tsx   # Active topics pill list, category colors
│   │   └── types.ts        # Topic interface, EventSummary.topic_slugs, EventFilters.topic
│   ├── vite.config.ts      # Dev proxy /api → localhost:8000
│   └── Dockerfile
├── nginx/
│   └── templates/
│       └── default.conf.template  # nginx reverse proxy template (envsubst)
├── version.txt             # Application version string
├── docker-compose.yml      # nginx, certbot, api, worker, scheduler, frontend, mongo, redis
└── CLAUDE.md               # ← you are here
```

---

## Conventions

### Django Apps

- Django apps (`core`, `accounts`, `api`, `newsletter`) live directly under `api/` with simple names:
  ```python
  name = 'core'
  label = 'core'
  ```
- `services/` contains stateless Python modules only — no Django models, no AppConfig
- `AUTH_USER_MODEL = 'accounts.User'` (label-based, not import path)
- Never import `accounts.User` directly — always use `get_user_model()`
- Always import models explicitly: `from core import models as core_models`
- `apps.py` at `api/apps.py` defines `MongoAdminConfig`, `MongoAuthConfig`, `MongoContentTypesConfig` — these set `default_auto_field = ObjectIdAutoField` for Django's built-in apps

### Migrations

- All migrations are centralized under `api/migrations/` and mapped via `MIGRATION_MODULES` in settings
- Django built-in apps (`auth`, `admin`, `contenttypes`) use custom MongoDB-compatible migrations — all use `ObjectIdAutoField` PKs
- Never run `makemigrations` for `auth`, `admin`, or `contenttypes` — manage those manually

### Models

- All core data models use `MongoManager` from `django-mongodb-backend`
- Never use `__date` ORM lookup on MongoDB — use explicit datetime range:
  ```python
  # Wrong
  Article.objects.filter(published_on__date=today)
  # Right
  Article.objects.filter(published_on__gte=start_of_day, published_on__lt=end_of_day)
  ```
- `Article.article_ids` stores UUID strings — convert before ORM filter:
  ```python
  uuids = [uuid.UUID(a) for a in event.article_ids]
  articles = Article.objects.filter(id__in=uuids)
  ```
- `Article.banner_image_url` — nullable URLField; populated by RSS `media:content`/`media:thumbnail`/enclosure extraction at fetch time, or OG image scrape during `process_articles` (best-effort, HTTPS only)
- `Event.started_at` is a DateTimeField — always timezone-aware (`django.utils.timezone.now()`)
- `Event.topic_slugs` — list of matched topic slugs (tagged by `tag_topics_task`)
- `CeleryMonitor` is an **unmanaged** model (`managed = False`) in the `misc` app — exists only as an admin registration hook, has no DB table

### Tasks / Background Jobs

All task functions live in `services/tasks.py` (pipeline + streams + topics + forecasting) and `newsletter/tasks.py`. They are **plain Python functions** — no decorator.

- Enqueue: `from services.queue import enqueue; enqueue(my_task, arg1, kwarg=val)`
- Task names follow the `*_task` suffix convention
- Management commands call task functions **directly** for inline/foreground execution; use `--background` to enqueue instead
- `enqueue()` calls the function synchronously when `TASK_QUEUE_ENABLED=False` (dev default)

To add a new background task:
1. Write the plain function in `services/tasks.py`
2. Enqueue it: `from services.queue import enqueue; enqueue(my_task, ...)`
3. Add it to `setup_schedule.py` if it should run periodically

### Scheduling (rq-scheduler)

All periodic jobs are registered by the `setup_schedule` management command (`api/core/management/commands/setup_schedule.py`). The `scheduler` Docker service runs this command on startup then launches `rqscheduler`.

| Task | Default interval |
|---|---|
| `fetch_articles_task` | 10m |
| `process_articles_task` | 10m |
| `aggregate_events_task` | 10m |
| `tag_topics_task` | 15m |
| `refresh_topics_task` | daily at 04:00 UTC (cron) |
| `fetch_prices_task` | 5m |
| `fetch_notams_task` | 15m |
| `fetch_earthquakes_task` | 5m |
| `fetch_forex_task` | 15m |
| `run_forecast_task` | 60m |
| `score_forecasts_task` | 60m |
| `generate_newsletter_task` | daily at 06:00 UTC (cron) |
| `discover_topics_task` | 30m |

To change an interval: update the env var and restart the `scheduler` service (it re-runs `setup_schedule` on startup, clearing and re-registering all jobs).

### Worker

The RQ worker is started via Django management command:

```bash
python manage.py rqworker default
```

In Docker the `worker` service runs this command directly.

### Scheduler

The `scheduler` Docker service runs `setup_schedule` then `rqscheduler`:

```
command: sh -c "python manage.py setup_schedule && rqscheduler --url $${REDIS_URL:-redis://redis:6379/0}"
```

`setup_schedule` clears all existing scheduled jobs and re-registers them — idempotent, safe to re-run.

### Semantic Clustering

`api/services/processing/clustering.py`:
- `SemanticClusterer.cluster(articles, threshold=0.55)` — groups articles by title similarity
- Model: `paraphrase-multilingual-MiniLM-L12-v2` (multilingual, ~90 MB, CPU-only)
- Uses `sentence_transformers.util.community_detection()` with `min_community_size=1`
- Model loaded lazily via `@cached_property`; singleton via `get_clusterer()`
- Called during `aggregate_events` AFTER geographic + category bucketing

### Forecasting

`api/services/forecasting/`:
- `service.py` — `run_forecasts()`: builds feature vector per symbol, calls LLM with structured prompt, stores `Forecast` object; `score_forecasts()`: fills `actual_value` once horizon elapses
- `features.py` — `build_feature_vector(symbol, at_time)`: price momentum (1h/24h), news sentiment mean/std, event intensity, category counts, routed event IDs
- `routing.py` — `route_event_to_symbols(category, location, topic_slugs)`: maps event attributes to affected market symbols (e.g. conflict + Ukraine → wheat, energy)
- Default symbols: Gold, Crude Oil, Natural Gas, Wheat, BTC, ETH, SPY, DXY, 10Y Treasury
- `Forecast` model fields: `symbol`, `stream_key`, `direction` (up/down/neutral), `confidence`, `predicted_value`, `actual_value`, `reasoning`, `event_ids`, `feature_vector`
- API: `GET /api/forecasts/` (filter by symbol/stream_key/horizon), `GET /api/forecasts/latest/` (latest per symbol)

### Topics

`api/services/topics/`:
- `matcher.py` — two matchers:
  - `TopicMatcher` — keyword-overlap; used by `retroactive_tag_topic` (fast, no LLM)
  - `LLMTopicMatcher` — batch LLM semantic matching; used by `tag_events_with_topics`; sends 10 events per call; falls back to `TopicMatcher` per-event on any LLM error
- `scraper.py` — runs `WikipediaCurrentEventsAdapter`; lookback window via `TOPIC_SOURCES_DAYS` env var (default: `30`)
- `sources/current_events.py` — `WikipediaCurrentEventsAdapter`: fetches `Portal:Current_events` daily subpages going back `num_days`; extracts situation-level prefixes (text before `:` in bullets); category from section heading
- `dedup.py` — `deduplicate_topics()` (slug-level) + `semantic_merge_topics()` (cosine ≥ 0.85)
- `_dates.py` — `parse_approximate_date()`: handles `"October 2023"` and year-only `"2014"`
- `Topic` model fields: `slug`, `name`, `keywords`, `description`, `category`, `is_current`, `is_active`, `source_ids`, `started_at`, `ended_at`, `topic_score`, `is_top_level`, `is_pinned`, `historical_month/day/year`
- `is_current` — in today's news cycle; `is_active` — enabled for display; `is_top_level` — promoted by score ≥ `TOP_LEVEL_SCORE_THRESHOLD` or `is_pinned`
- Frontend API: `GET /api/topics/?active=true&current=true`

### Newsletter

- `DailyNewsletter` lives in `api/newsletter/models.py` — fields: `date` (unique), `subject`, `body` (Markdown), `articles` (JSON snapshot), `cover_image_url`, `cover_image_credit`, `status`, `event_count`
- Newsletter body is stored as **Markdown** and converted to HTML at send time in `sender.py` — `<h2>` tags get inline-styled for email client compatibility
- `generate_newsletter()` in `services/newsletter/generator.py` — groups events by category, sends per-category LLM prompt, stores article snapshot + cover image; idempotent (skips if date exists)
- `send_newsletter()` in `services/newsletter/sender.py` — converts Markdown → HTML, sends to active subscribers; skips already-sent newsletters
- `ArticleDatum` in `services/data/base.py` uses a required base TypedDict + optional `banner_image_url` extension (`total=False` on the subclass only); all other fields are required
- Frontend newsletter route: `/newsletter` (list + reader), `/newsletter/YYYY/MM/DD` (direct date URL — falls back to latest published if date not found)
- `NewsletterView` accepts an optional `initialData` prop — pass it to skip the internal fetch when data is already loaded

### NLP / Processing

- `services/processing/analyzer.py` — main article processing (NER, sentiment, geocoding)
- `services/processing/cleaner.py` — text normalization
- `services/processing/clustering.py` — semantic event grouping (see above)
- `ArticleDocument` and `ArticleFeatures` dataclasses live in `core/models.py`

### API (DRF)

- All views use `rest_framework.views.APIView` or `generics.*`
- All responses serialized via DRF serializers in `api/serializers.py`
- No raw `JsonResponse` — use `Response` from `rest_framework.response`
- URL pattern: `/api/<resource>/` list, `/api/<resource>/<id>/` detail
- Topic endpoints: `/api/topics/`, `/api/topics/<slug>/`, `/api/topics/<slug>/events/`

### Frontend

- All API calls go through typed modules in `src/api/` (`events.ts`, `newsletter.ts`, `streams.ts`, `topics.ts`)
- React state lives in `src/pages/index.tsx`; pass down as props
- Map markers use custom `L.divIcon` via category shape SVG; never plain `Marker` with default icon
- Frontend uses **Waku** for file-based routing under `src/pages/`; static pages use `render: 'static'`, dynamic pages use `render: 'dynamic'`
- Dynamic pages read route params from `window.location.pathname` (no Waku router hook needed)
- All source files are TypeScript (`.tsx`/`.ts`) — not `.jsx`/`.js`
- Dark theme color palette (inline styles):
  - Background: `#0f0f13`
  - Card: `#1a1a22`
  - Border: `#2a2a35`
  - Text primary: `#e8e8f0`
  - Text secondary: `#888899`
- Category colors (defined in `MapView.tsx` and `EventCard.tsx` — keep in sync):
  ```ts
  const CATEGORY_COLOR: Record<string, string> = {
    conflict:  '#e05252',
    protest:   '#e09652',
    disaster:  '#e0c852',
    political: '#7c9ef8',
    economic:  '#52c8a0',
    crime:     '#c852c8',
    general:   '#888',
  }
  ```
- Topic filtering: `activeTopic: string | null` state in `index.tsx`; passed to `fetchEvents()` as `?topic=<slug>` and down to `EventList` / `EventCard` for badge highlighting
- `TopicsPanel` fetches `active=true&current=true` topics; clicking a topic pill toggles `activeTopic`
- `EventCard` renders up to 3 topic slug badges; active badge highlighted in blue; overflow shown as `+N more`

---

## Recipes — Common Tasks

### Add a new API endpoint

1. Add serializer to `api/api/serializers.py`
2. Add view to `api/api/views/` — subclass `APIView` or `generics.ListAPIView`
3. Register URL in `api/api/urls.py`
4. Add fetch function in `ui/src/api/`

### Add a new model field

1. Add field to model in `api/core/models.py`
2. Run `python manage.py makemigrations core`
3. Update relevant serializer in `api/api/serializers.py`
4. Update admin in `api/core/admin.py` if needed

### Add a new management command

1. Create `api/core/management/commands/<name>.py`
2. Subclass `BaseCommand`, implement `handle(self, *args, **options)`
3. Import models as `from core import models as core_models`
4. Call `from services.queue import enqueue; enqueue(my_task, ...)` for background execution

### Add a new scheduled job

1. Write a plain function in `services/tasks.py`
2. Add a `scheduler.schedule(...)` or `scheduler.cron(...)` call in `api/core/management/commands/setup_schedule.py`
3. Restart the `scheduler` Docker service to apply

### Add a new React component

1. Create `ui/src/components/MyComponent.tsx`
2. Use inline styles matching the dark theme palette above
3. Import and use in a page or parent component

### Add a new filter to /api/events/

1. Add query param parsing in `EventListView.get()` in `api/api/views/events.py`
2. Chain `.filter(...)` on the queryset
3. Add param to `fetchEvents(filters)` in `ui/src/api/events.ts`
4. Add UI control; manage state in `ui/src/pages/index.tsx`

---

## Key Files — Quick Reference

| Purpose | File |
|---------|------|
| Data models | `api/core/models.py` |
| All task functions | `api/services/tasks.py` |
| Enqueue helper | `api/services/queue.py` → `enqueue()` |
| Periodic schedule | `api/core/management/commands/setup_schedule.py` |
| Pipeline orchestration | `api/services/workflow.py` |
| Semantic clustering | `api/services/processing/clustering.py` |
| Topic matching (keyword) | `api/services/topics/matcher.py` → `TopicMatcher` |
| Topic matching (LLM batch) | `api/services/topics/matcher.py` → `LLMTopicMatcher` |
| Topic source | `api/services/topics/sources/current_events.py` |
| API views | `api/api/views/` |
| API serializers | `api/api/serializers.py` |
| API URLs | `api/api/urls.py` |
| Django settings | `api/settings/base.py` |
| Root URLs | `api/app/urls.py` |
| Mongo app configs | `api/apps.py` |
| Queue monitor template | `api/templates/admin/misc/celery_monitor.html` |
| React root / state | `ui/src/pages/index.tsx` |
| API client (events) | `ui/src/api/events.ts` |
| API client (topics) | `ui/src/api/topics.ts` |
| API client (newsletter) | `ui/src/api/newsletter.ts` |
| Topics panel | `ui/src/components/topics/TopicsPanel.tsx` |
| Map component | `ui/src/components/events/MapView.tsx` |
| Newsletter models | `api/newsletter/models.py` |
| Newsletter generator | `api/services/newsletter/generator.py` |
| Newsletter sender | `api/services/newsletter/sender.py` |
| Waku pages | `ui/src/pages/` |
| Docker services | `docker-compose.yml` |
| Python deps | `api/requirements.txt` |

---

## Pipeline

```
fetch_articles_task (every 10m, timeout 30m)
  └─ Telethon / HTTP → Article objects in MongoDB

process_articles_task (every 10m, timeout 30m)
  └─ NER + VADER sentiment + geocoding → Article metadata fields (category, location, etc.)

aggregate_events_task (every 10m, timeout 30m)
  └─ Bucket by (city, country, category, date)
     → semantic sub-cluster via SemanticClusterer (cosine similarity ≥ 0.55)
     → upsert Event objects in MongoDB keyed on (location_name, category, day)

tag_topics_task (every 15m, timeout 30m)
  └─ LLMTopicMatcher (batch, 10 events/call) → sets Event.topic_slugs for recent events
     Falls back to TopicMatcher per-event on LLM error

refresh_topics_task (daily 04:00, timeout 30m)
  └─ WikipediaOngoingConflictsAdapter + WikipediaCurrentSituationsAdapter
     → deduplicate_topics → semantic_merge_topics (threshold=0.85)
     → _enrich_topics (LLM: descriptions + expanded keywords, batch 30)
     → upsert Topic objects; mark stale topics is_current=False

generate_newsletter_task (daily 06:00, timeout 30m)
  └─ LLM-based newsletter draft → DailyNewsletter.body (Markdown)
```

All tasks run on RQ workers (Redis broker). Each has a 30-minute hard time limit (`JOB_TIMEOUT_SECONDS`).

| Task | Interval | Timeout |
|------|----------|---------|
| fetch_articles_task | 10m | 30m |
| process_articles_task | 10m | 30m |
| aggregate_events_task | 10m | 30m |
| tag_topics_task | 15m | 30m |
| refresh_topics_task | daily 04:00 | 30m |
| fetch_prices_task | 5m | 30m |
| fetch_notams_task | 15m | 30m |
| fetch_earthquakes_task | 5m | 30m |
| fetch_forex_task | 15m | 30m |
| run_forecast_task | 60m | 30m |
| score_forecasts_task | 60m | 30m |
| generate_newsletter_task | daily 06:00 | 30m |

---

## Docker Services

| Service | Command | Port |
|---------|---------|------|
| `api` | `uvicorn app.asgi:application` | 8000 (internal) |
| `worker` | `python manage.py rqworker default` | — |
| `scheduler` | `setup_schedule && rqscheduler --url $REDIS_URL` | — |
| `frontend` | build → copy dist | — |
| `nginx` | reverse proxy | 80, 443 |
| `redis` | broker + cache | — |
| `mongo` | database | 27017 |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | — | Django secret key (required) |
| `DATABASE_URL` | `mongodb://root:1234@localhost:27017/radar-live?authSource=admin` | MongoDB URI |
| `DATABASE_NAME` | `radar-live` | MongoDB database name |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis URI (RQ broker + cache) |
| `DOMAIN` | `localhost` | Public hostname for nginx + Let's Encrypt |
| `ENV_NAME` | `development` | Shown in X-App-Version header |
| `TASK_QUEUE_ENABLED` | `false` | If false, `enqueue()` calls functions synchronously (no Redis needed) |
| `FETCH_INTERVAL_MINUTES` | `10` | fetch_articles_task period |
| `PROCESS_INTERVAL_MINUTES` | `10` | process_articles_task period |
| `AGGREGATE_INTERVAL_MINUTES` | `10` | aggregate_events_task period |
| `TAG_TOPICS_INTERVAL_MINUTES` | `15` | tag_topics_task period |
| `TOPICS_REFRESH_HOUR` | `4` | Hour (UTC) for daily refresh_topics_task |
| `PRICE_FETCH_INTERVAL_MINUTES` | `5` | fetch_prices_task period |
| `NOTAM_FETCH_INTERVAL_MINUTES` | `15` | fetch_notams_task period |
| `EARTHQUAKE_FETCH_INTERVAL_MINUTES` | `5` | fetch_earthquakes_task period |
| `FOREX_FETCH_INTERVAL_MINUTES` | `15` | fetch_forex_task period |
| `FORECAST_INTERVAL_MINUTES` | `60` | run_forecast_task period |
| `FORECAST_SCORE_INTERVAL_MINUTES` | `60` | score_forecasts_task period |
| `NEWSLETTER_GENERATE_HOUR` | `6` | Hour (UTC) for daily newsletter generation |
| `JOB_TIMEOUT_SECONDS` | `1800` | RQ job timeout (30m) — passed to `enqueue()` and `setup_schedule` |

---

## Gotchas

- **MongoDB date filters**: never `__date=`, always explicit datetime range
- **UUID filtering**: `article_ids` stores strings; convert with `uuid.UUID()` first
- **No Celery**: removed entirely — do not add back; use `services.queue.enqueue()` + plain functions
- **`enqueue()` dev mode**: when `TASK_QUEUE_ENABLED=False`, `enqueue()` calls the function synchronously — no Redis or worker needed locally
- **Schedule is stored in Redis**: `setup_schedule` clears and re-registers all jobs on every `scheduler` container start — this is intentional and idempotent
- **Restart scheduler to change intervals**: edit the env var and restart the `scheduler` service; it re-runs `setup_schedule` automatically
- **App names**: Django apps use simple names (`'core'`, `'accounts'`, `'api'`, `'newsletter'`) — no path prefix
- **Model imports**: use `from core import models as core_models` — never bare `import core.models`
- **services/ imports**: plain Python modules — e.g. `from services.processing.clustering import get_clusterer`
- **QueueMonitor (CeleryMonitor model)**: unmanaged model in `misc` app — never run `makemigrations` for it, never query it; admin view uses django-rq + rq-scheduler inspect APIs
- **DRF**: all API responses must go through serializers — no hand-built dicts in views
- **Migrations**: all centralized in `api/migrations/`; mapped via `MIGRATION_MODULES` in settings
- **Built-in migrations**: `auth`, `admin`, `contenttypes` migrations are custom MongoDB-compatible files — do not regenerate with `makemigrations`
- **DATABASE_URL goes in HOST**: `django-mongodb-backend` reads the connection string from `DATABASES['default']['HOST']`, not `DATABASE_URL`
- **Frontend proxy**: in dev, Vite proxies `/api` → `localhost:8000`; in prod, nginx does it
- **nginx HTTPS**: run `./nginx/init-letsencrypt.sh` once before `docker compose up` in production
- **decouple .env**: `python-decouple` searches from CWD — place `.env` in project root or `cd api` before running manage.py locally
- **ArticleDatum `total=False`**: only `banner_image_url` is optional; required fields enforced by `_ArticleDatumRequired` base TypedDict — do not flatten to a single `total=False` dict
- **Newsletter body is Markdown**: stored as raw Markdown in `DailyNewsletter.body`; converted to HTML at send time — do not store HTML
- **Email `<h2>` styling**: done via regex replace in `sender.py` (inline styles) — email clients strip `<style>` blocks inconsistently
- **Newsletter date URL**: `/newsletter/YYYY/MM/DD` falls back to latest published newsletter on 404 — treat the date as a soft hint, not a hard key
- **Semantic clustering threshold**: default 0.55 cosine similarity. Lower = more aggressive merging; higher = more splits. Do not change without testing.
- **Frontend TypeScript only**: all UI files are `.tsx`/`.ts` — never create `.jsx`/`.js`
- **Topic sources**: single source `WikipediaCurrentEventsAdapter` using `Portal:Current_events` date subpages. `TOPIC_SOURCES_DAYS` env var sets the lookback window (default: `30`). Old sources (`wikipedia-ongoing-conflicts`, `wikipedia-current-situations`, `gdelt-conflicts`) are removed — do not reference them.
- **`tag_events_with_topics` uses LLM**: `LLMTopicMatcher` sends batches of 10 events per LLM call; `retroactive_tag_topic` still uses the fast keyword-based `TopicMatcher`.
- **`refresh_topics` runs LLM enrichment**: `Workflow._enrich_topics()` calls the LLM after scraping to generate proper descriptions and expand keywords (batches of 30). Falls back silently — topics are upserted with raw scraped metadata if LLM is unavailable.
- **LLM responses: always strip code fences**: use `re.sub(r'^```(?:json)?\s*', '', r)` + `re.sub(r'\s*```$', '', r)` before `json.loads()`. All LLM-calling code in the project does this — do not omit it in new code.

---

## Dev Commands

```bash
# Start everything
docker compose up

# Run from api/ directory (decouple reads .env from CWD)
cd api

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Pipeline commands — all support inline (default) and --background (RQ queue) modes.
# Without --background: task runs directly in this process (no Redis required).
# With    --background: task is enqueued via django-rq; if TASK_QUEUE_ENABLED=False it
#                       still runs synchronously (enqueue() calls the function directly).

# Fetch articles for a source (last N hours)
python manage.py fetch_data <source_code> --hours 6
python manage.py fetch_data <source_code> --hours 6 --background

# Run NLP pipeline
python manage.py process_articles --limit 500
python manage.py process_articles --limit 500 --background

# Aggregate processed articles into events
python manage.py aggregate_events --hours 24
python manage.py aggregate_events --hours 24 --background

# Tag events with topics
python manage.py tag_topics --hours 24
python manage.py tag_topics --hours 24 --background

# Retroactively tag events for a single topic
python manage.py retroactive_tag_topic <slug>
python manage.py retroactive_tag_topic <slug> --background

# Refresh topics list
python manage.py refresh_topics
python manage.py refresh_topics --background

# Generate newsletter for a date
python manage.py generate_newsletter --date 2025-03-08

# Send newsletter for a date
python manage.py send_newsletter --date 2025-03-08

# Run the full pipeline end-to-end and write a JSON report for manual inspection
python manage.py e2e_pipeline                              # default: 6h fetch, 24h window, 5 samples
python manage.py e2e_pipeline --source <code> --fetch-hours 12 --hours 48
python manage.py e2e_pipeline --skip-fetch --skip-process  # aggregate + tag only
python manage.py e2e_pipeline --samples 10 --output /tmp/report.json
# Report written to ./e2e_report_<timestamp>.json — contains per-step counts,
# ok/error flags, and sample article/event/topic snapshots at each stage.

# Run RQ worker locally
python manage.py rqworker default

# Register periodic schedule with rq-scheduler (run once, or on every scheduler start)
python manage.py setup_schedule

# Run rq-scheduler locally (after setup_schedule)
rqscheduler --url redis://localhost:6379/0

# Inspect RQ queue stats
python manage.py rqstats

# Django admin queue monitor
# http://localhost:8000/admin/ → "Queue Monitor" (shows active workers, queued + scheduled jobs)

# Frontend dev server (port 5173, proxies /api to localhost:8000)
cd ui && npm run dev

# Build frontend
cd ui && npm run build
```

---

## Testing Checklist

Before shipping any backend change:
- [ ] `python manage.py check` passes
- [ ] `python manage.py migrate --check` (no unapplied migrations)
- [ ] API endpoints return expected shape (test with curl or browser)
- [ ] `python manage.py e2e_pipeline` completes without errors; inspect the JSON report to verify article → event → topic flow

Before shipping any frontend change:
- [ ] `npm run build` succeeds in `ui/`
- [ ] Map renders markers correctly
- [ ] Event list and cards expand/collapse without errors
- [ ] Filters (category, topic) apply correctly to map and list
- [ ] Topic pills in `TopicsPanel` toggle `activeTopic` correctly
