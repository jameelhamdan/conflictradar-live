# CLAUDE.md — Radar-Live Dev Guide

This file gives Claude everything needed to write correct, consistent code for this project without re-reading the codebase from scratch each session.

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | Django 6 + django-mongodb-backend |
| Task queue | Redis + RQ + django-rq |
| Storage | MongoDB 8 |
| Ingestion | Telethon (Telegram) + requests |
| NLP | spaCy + VADER + geopy |
| Frontend | React 19 + Vite + react-leaflet |
| Serving | uvicorn (backend) + nginx reverse proxy |
| Containers | Docker Compose |

---

## Directory Map

> Ignore `__pycache__/` and `*.pyc` files everywhere — they are Python bytecode caches, not source.

```
./
├── backend/                # All Django/Python source (Docker build context: ./backend, PYTHONPATH=/app)
│   ├── app/                # WSGI/ASGI entry, URLs, middleware, auth backend
│   │   ├── __init__.py     # Version info (reads version.txt from project root)
│   │   ├── asgi.py         # ASGI application entry point
│   │   ├── wsgi.py         # WSGI application entry point (unused; uvicorn runs asgi.py)
│   │   ├── urls.py         # Root URLconf — admin/ + api/
│   │   ├── backends.py     # ModelAuthBackend (respects user.can_login)
│   │   └── middleware.py   # X-App-Version header
│   ├── apps.py             # MongoAdminConfig, MongoAuthConfig, MongoContentTypesConfig
│   ├── core/               # Django app — data models + management commands
│   │   ├── apps.py         # name='core', label='core'
│   │   ├── models.py       # Source, Article, Event + ArticleDocument/ArticleFeatures
│   │   ├── tasks.py        # fetch_articles, process_articles, aggregate_events
│   │   ├── admin.py
│   │   └── management/commands/
│   │       ├── fetch_data.py        # Thin wrapper → tasks.fetch_articles
│   │       ├── process_articles.py  # Thin wrapper → tasks.process_articles
│   │       └── aggregate_events.py  # Thin wrapper → tasks.aggregate_events
│   ├── accounts/           # Custom User model + Session + Group proxies
│   │   ├── apps.py         # name='accounts', label='accounts'
│   │   ├── models.py       # User (email-based), UserManager
│   │   └── admin.py
│   ├── api/                # DRF REST API
│   │   ├── apps.py         # name='api', label='api'
│   │   ├── serializers.py
│   │   ├── views.py        # EventListView, EventDetailView, SourceListView
│   │   └── urls.py
│   ├── services/           # Stateless Python services (no Django models)
│   │   ├── cleaning/       # NLP — import as services.cleaning
│   │   │   ├── __init__.py # exports: ArticleCleaner, categorize, CleaningError
│   │   │   ├── cleaner.py  # ArticleCleaner — spaCy NER + VADER + categorization
│   │   │   ├── categorizer.py
│   │   │   └── exceptions.py
│   │   ├── location/       # Geocoding — import as services.location
│   │   │   ├── __init__.py # exports: Geocoder
│   │   │   └── geocoder.py # Nominatim via geopy, 30-day cache
│   │   └── data/           # Ingestion — import as services.data
│   │       ├── __init__.py # exports DataService
│   │       ├── base.py
│   │       └── telegram.py
│   ├── migrations/         # All app migrations (centralized, mapped via MIGRATION_MODULES)
│   │   ├── accounts/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── contenttypes/
│   │   └── core/
│   ├── settings/
│   │   └── base.py         # All config — DB, cache, RQ, auth, logging
│   ├── manage.py           # Django CLI
│   ├── requirements.txt
│   ├── release.sh          # collectstatic + migrate (run by Docker on backend startup)
│   ├── Dockerfile          # Python image — build context: ./backend, PYTHONPATH=/app
│   └── worker.py           # RQ workers + scheduler + health check
├── frontend/               # React 19 SPA
│   ├── src/
│   │   ├── App.jsx         # Root component — polling, filters, layout
│   │   ├── api/events.js   # fetchEvents(), fetchEventDetail()
│   │   └── components/
│   │       ├── MapView.jsx     # Leaflet map + CircleMarkers
│   │       ├── EventList.jsx   # Scrollable event list
│   │       └── EventCard.jsx   # Expandable event card with articles
│   ├── vite.config.js      # Dev proxy /api → localhost:8000
│   ├── Dockerfile          # Multi-stage: node build → nginx serve
│   └── nginx.conf          # SPA-only: try_files + static asset caching
├── nginx/
│   ├── templates/
│   │   └── default.conf.template  # nginx reverse proxy template (envsubst)
│   └── init-letsencrypt.sh # One-time TLS bootstrap (run from project root)
├── version.txt             # Application version string
├── docker-compose.yml      # nginx, certbot, backend, worker, frontend, mongo, redis
└── CLAUDE.md               # ← you are here
```

---

## Conventions

### Django Apps

- Django apps (`core`, `accounts`, `api`) live directly under `backend/` with simple names:
  ```python
  name = 'core'
  label = 'core'
  ```
- `services/` contains stateless Python modules only — no Django models, no AppConfig
- `AUTH_USER_MODEL = 'accounts.User'` (label-based, not import path)
- Never import `accounts.User` directly — always use `get_user_model()`
- Always import models explicitly: `from core import models as core_models`
- `apps.py` at `backend/apps.py` defines `MongoAdminConfig`, `MongoAuthConfig`, `MongoContentTypesConfig` — these set `default_auto_field = ObjectIdAutoField` for Django's built-in apps

### Migrations

- All migrations are centralized under `backend/migrations/` and mapped via `MIGRATION_MODULES` in settings
- Django built-in apps (`auth`, `admin`, `contenttypes`) use custom MongoDB-compatible migrations in `migrations/auth/`, `migrations/admin/`, `migrations/contenttypes/` — all use `ObjectIdAutoField` PKs
- Never run `makemigrations` for `auth`, `admin`, or `contenttypes` — manage those manually

### Models

- All core data models (`Article`, `Event`) use `MongoManager` from `django-mongodb-backend`
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

### Newsletter

- `DailyNewsletter` lives in `backend/newsletter/models.py` — fields: `date` (unique), `subject`, `body` (Markdown), `articles` (JSON snapshot), `cover_image_url`, `cover_image_credit`, `status`, `event_count`
- Newsletter body is stored as **Markdown** and converted to HTML at send time in `sender.py` — `<h2>` tags get inline-styled for email client compatibility
- `generate_newsletter()` in `services/newsletter/generator.py` — groups events by category, sends per-category LLM prompt, stores article snapshot + cover image; idempotent (skips if date exists)
- `send_newsletter()` in `services/newsletter/sender.py` — converts Markdown → HTML, sends to active subscribers; skips already-sent newsletters
- `ArticleDatum` in `services/data/base.py` uses a required base TypedDict + optional `banner_image_url` extension (`total=False` on the subclass only); all other fields are required
- Frontend newsletter route: `/newsletter` (list + reader), `/newsletter/YYYY/MM/DD` (direct date URL — falls back to latest published if date not found)
- `NewsletterView` accepts an optional `initialData` prop — pass it to skip the internal fetch when data is already loaded

### NLP / Cleaning

- `services/cleaning/` is a plain Python module — import with `from services.cleaning import ...`
- `ArticleCleaner().clean_batch(documents)` returns `list[ArticleFeatures]` (Step 2 in pipeline)
- `ArticleFeatures` now includes `category` — no need to call `categorize()` separately after cleaning
- `ArticleDocument` and `ArticleFeatures` dataclasses live in `core/models.py`
- `categorize(text)` is still importable from `services.cleaning` for ad-hoc use

### API (DRF)

- All views use `rest_framework.views.APIView` or `generics.*`
- All responses serialized via DRF serializers in `api/serializers.py`
- No raw `JsonResponse` — use `Response` from `rest_framework.response`
- URL pattern: `/api/<resource>/` list, `/api/<resource>/<id>/` detail

### Tasks / Background Jobs

- All task logic lives in `core/tasks.py` as plain callables
- Management commands are thin wrappers that parse args then call or enqueue the task
- The scheduler in `worker.py` enqueues task functions directly — never `call_command`
- To add a new background task:
  1. Write the function in `core/tasks.py`
  2. Enqueue it: `django_rq.get_queue('default').enqueue(my_task, arg, job_timeout=1800)`
  3. Schedule it in `run_scheduler()` if periodic
- `worker.py` calls `django.setup()` exactly once in `run_scheduler()` — never again elsewhere
- Always pass `job_timeout=1800` (30 min) to every `queue.enqueue(...)` call

### Frontend

- All API calls go through typed modules in `src/api/` (`events.ts`, `newsletter.ts`, etc.)
- React state lives in `App.tsx`; pass down as props
- Map markers use custom `L.divIcon` via category shape SVG; never plain `Marker` with default icon
- Frontend uses **Waku** for file-based routing under `src/pages/`; static pages use `render: 'static'`, dynamic pages use `render: 'dynamic'`
- Dynamic pages read route params from `window.location.pathname` (no Waku router hook needed)
- Dark theme color palette (inline styles):
  - Background: `#0f0f13`
  - Card: `#1a1a22`
  - Border: `#2a2a35`
  - Text primary: `#e8e8f0`
  - Text secondary: `#888899`
- Category colors (defined in `MapView.jsx` and `EventCard.jsx` — keep in sync):
  ```js
  const CATEGORY_COLOR = {
    conflict:  '#e05252',
    protest:   '#e09652',
    disaster:  '#e0c852',
    political: '#7c9ef8',
    economic:  '#52c8a0',
    crime:     '#c852c8',
    general:   '#888',
  }
  ```

---

## Recipes — Common Tasks

### Add a new API endpoint

1. Add serializer to [backend/api/serializers.py](backend/api/serializers.py)
2. Add view to [backend/api/views.py](backend/api/views.py) — subclass `APIView` or `generics.ListAPIView`
3. Register URL in [backend/api/urls.py](backend/api/urls.py)
4. Add fetch function in [frontend/src/api/events.js](frontend/src/api/events.js)

### Add a new model field

1. Add field to model in [backend/core/models.py](backend/core/models.py)
2. Run `python backend/manage.py makemigrations core`
3. Update relevant serializer in [backend/api/serializers.py](backend/api/serializers.py)
4. Update admin in [backend/core/admin.py](backend/core/admin.py) if needed

### Add a new management command

1. Create `backend/core/management/commands/<name>.py`
2. Subclass `BaseCommand`, implement `handle(self, *args, **options)`
3. Import models as `from core import models as core_models`
4. Add enqueue helper in [backend/worker.py](backend/worker.py): `queue.enqueue(my_task, job_timeout=JOB_TIMEOUT_SECONDS)`
5. Register schedule in `run_scheduler()` if periodic

### Add a new scheduled job

In [backend/worker.py](backend/worker.py) inside `run_scheduler()`:
```python
schedule.every(N).minutes.do(enqueue_my_job)
```
Define `enqueue_my_job()` above it following the existing pattern.

### Add a new React component

1. Create `frontend/src/components/MyComponent.jsx`
2. Use inline styles matching the dark theme palette above
3. Import and use in `App.jsx` or a parent component

### Add a new filter to /api/events/

1. Add query param parsing in `EventListView.get()` in [backend/api/views.py](backend/api/views.py)
2. Chain `.filter(...)` on the queryset
3. Add param to `fetchEvents(filters)` in [frontend/src/api/events.js](frontend/src/api/events.js)
4. Add UI control in `App.jsx`

---

## Key Files — Quick Reference

| Purpose | File |
|---------|------|
| Data models | [backend/core/models.py](backend/core/models.py) |
| Pipeline tasks | [backend/core/tasks.py](backend/core/tasks.py) |
| API views | [backend/api/views.py](backend/api/views.py) |
| API serializers | [backend/api/serializers.py](backend/api/serializers.py) |
| API URLs | [backend/api/urls.py](backend/api/urls.py) |
| Worker + scheduler | [backend/worker.py](backend/worker.py) |
| Django settings | [backend/settings/base.py](backend/settings/base.py) |
| Root URLs | [backend/app/urls.py](backend/app/urls.py) |
| Mongo app configs | [backend/apps.py](backend/apps.py) |
| React root | [frontend/src/components/App.tsx](frontend/src/components/App.tsx) |
| API client (events) | [frontend/src/api/events.ts](frontend/src/api/events.ts) |
| API client (newsletter) | [frontend/src/api/newsletter.ts](frontend/src/api/newsletter.ts) |
| Map component | [frontend/src/components/events/MapView.tsx](frontend/src/components/events/MapView.tsx) |
| Newsletter models | [backend/newsletter/models.py](backend/newsletter/models.py) |
| Newsletter generator | [backend/services/newsletter/generator.py](backend/services/newsletter/generator.py) |
| Newsletter sender | [backend/services/newsletter/sender.py](backend/services/newsletter/sender.py) |
| Waku pages | [frontend/src/pages/](frontend/src/pages/) |
| Docker services | [docker-compose.yml](docker-compose.yml) |
| Python deps | [backend/requirements.txt](backend/requirements.txt) |

---

## Pipeline

```
fetch_data (every 10m, timeout 30m)
  └─ Telethon / HTTP → Article objects in MongoDB

process_articles (every 10m, timeout 30m)
  └─ spaCy NER + VADER sentiment + geopy → Article NLP fields

aggregate_events (every 10m, timeout 30m)
  └─ Groups articles by (location, date) → Event objects in MongoDB
```

All three stages run on RQ queues via scheduler. Each job has a 30-minute hard timeout — if it hasn't finished by then, the worker kills it and the next cycle starts fresh.

| Job | Interval | Timeout |
|-----|----------|---------|
| fetch_data | 10m | 30m |
| process_articles | 10m | 30m |
| aggregate_events | 10m | 30m |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | — | Django secret key (required) |
| `DATABASE_URL` | `mongodb://root:1234@localhost:27017/radar-live?authSource=admin` | MongoDB URI |
| `DATABASE_NAME` | `radar-live` | MongoDB database name |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis URI |
| `DOMAIN` | `localhost` | Public hostname for nginx + Let's Encrypt |
| `ENV_NAME` | `development` | Shown in X-App-Version header |
| `TASK_QUEUE_ENABLED` | `false` | Enable RQ task enqueueing |
| `WORKER_COUNT` | `4` | Number of RQ worker processes |
| `FETCH_INTERVAL_MINUTES` | `10` | How often to fetch new articles |
| `PROCESS_INTERVAL_MINUTES` | `10` | How often to run NLP pipeline |
| `AGGREGATE_INTERVAL_MINUTES` | `10` | How often to aggregate events |

---

## Gotchas

- **MongoDB date filters**: never `__date=`, always explicit datetime range
- **UUID filtering**: `article_ids` stores strings; convert with `uuid.UUID()` first
- **`django.setup()`**: called once in `run_scheduler()` — never in job helpers or commands
- **App names**: Django apps use simple names (`'core'`, `'accounts'`, `'api'`) — no `services.` prefix
- **Model imports**: use `from core import models as core_models` — never bare `import core.models`
- **services/ imports**: `from services.cleaning import ...`, `from services.location import ...` — these are plain Python modules, not Django apps
- **DRF**: all API responses must go through serializers — no hand-built dicts in views
- **Migrations**: all centralized in `backend/migrations/`; mapped via `MIGRATION_MODULES` in settings
- **Built-in migrations**: `auth`, `admin`, `contenttypes` migrations are custom MongoDB-compatible files — do not regenerate with `makemigrations`
- **DATABASE_URL goes in HOST**: `django-mongodb-backend` reads the connection string from `DATABASES['default']['HOST']`, not `DATABASE_URL`
- **Frontend proxy**: in dev, Vite proxies `/api` → `localhost:8000`; in prod, nginx does it
- **nginx HTTPS**: run `./init-letsencrypt.sh` once before `docker compose up` in production
- **decouple .env**: `python-decouple` searches from CWD — place `.env` in project root or `cd backend` before running manage.py locally
- **ArticleDatum `total=False`**: only `banner_image_url` is optional; the required fields (`source_url`, `title`, `content`, etc.) are enforced by the base TypedDict `_ArticleDatumRequired` — do not flatten back to a single `total=False` dict
- **Newsletter body is Markdown**: stored as raw Markdown in `DailyNewsletter.body`; converted to HTML at send time — do not store HTML
- **Email `<h2>` styling**: done via regex replace in `sender.py` (inline styles) not in the template — email clients strip `<style>` blocks inconsistently
- **Newsletter date URL**: `/newsletter/YYYY/MM/DD` falls back to latest published newsletter on 404 — treat the date as a soft hint, not a hard key

---

## Dev Commands

```bash
# Start everything
docker compose up

# Run from project root (decouple reads .env from CWD)
cd backend

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Manually fetch messages for a source (last N hours) — runs in foreground
python manage.py fetch_data <source_code> --hours 6

# Enqueue fetch as a background RQ job (returns immediately)
python manage.py fetch_data <source_code> --hours 6 --background

# Run NLP pipeline (foreground or background)
python manage.py process_articles --limit 500
python manage.py process_articles --limit 500 --background

# Aggregate processed articles into events (foreground or background)
python manage.py aggregate_events --hours 24
python manage.py aggregate_events --hours 24 --background

# Generate newsletter for a date (foreground)
python manage.py generate_newsletter --date 2025-03-08

# Send newsletter for a date (foreground)
python manage.py send_newsletter --date 2025-03-08

# Run worker locally
python worker.py

# Frontend dev server (port 5173, proxies /api to localhost:8000)
cd frontend && npm run dev

# Build frontend
cd frontend && npm run build
```

---

## Testing Checklist

Before shipping any backend change:
- [ ] `python manage.py check` passes
- [ ] `python manage.py migrate --check` (no unapplied migrations)
- [ ] API endpoints return expected shape (test with curl or browser)

Before shipping any frontend change:
- [ ] `npm run build` succeeds in `frontend/`
- [ ] Map renders markers correctly
- [ ] Event list and cards expand/collapse without errors
- [ ] Filters apply correctly to map and list
