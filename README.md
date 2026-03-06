# radar-live

Live event detection and mapping system. Ingests news from Telegram channels and web sources, runs NLP analysis (HuggingFace NER + VADER + BERT categorization + mordecai3 geoparsing), clusters articles into geolocated events, and displays them on an interactive Leaflet world map.

See [project.md](project.md) for full requirements and architecture. See [CLAUDE.md](CLAUDE.md) for developer conventions and recipes.

---

## Stack

| Layer | Tech |
| ----- | ---- |
| Backend | Django 6 + DRF + django-mongodb-backend |
| Task queue | Redis + RQ + RQ CronScheduler |
| Storage | MongoDB 8 |
| Ingestion | Telethon (Telegram) + scrapling + requests |
| NLP | HuggingFace transformers (dslim/bert-base-NER) + VADER + sentence-transformers + mordecai3 |
| Frontend | React 19 + Waku + react-leaflet + TypeScript |
| Serving | gunicorn + nginx (reverse proxy + TLS) |
| TLS | Let's Encrypt via certbot |
| Containers | Docker Compose |

---

## Quick Start

### Production (with HTTPS)

Point your domain's DNS A record at the server, then:

```bash
export DOMAIN=yourdomain.com
export CERTBOT_EMAIL=admin@yourdomain.com

bash init-letsencrypt.sh           # one-time: gets the TLS cert
DOMAIN=$DOMAIN docker compose up -d
DOMAIN=$DOMAIN docker compose exec web python manage.py migrate
DOMAIN=$DOMAIN docker compose exec web python manage.py createsuperuser
```

Access:

- Map: <https://yourdomain.com>
- API: <https://yourdomain.com/api/>
- Admin: <https://yourdomain.com/admin/>
- Worker health: <http://yourdomain.com:8001/>

### Local / HTTP-only

```bash
DOMAIN=localhost docker compose up --build
docker compose exec web python manage.py migrate
```

Access at <http://localhost>.

### Local Development (no Docker)

Prerequisites: Python 3.11+, [uv](https://github.com/astral-sh/uv), MongoDB, Redis, Node 22+

```bash
# Backend
cd backend
uv pip install -r requirements.txt
python manage.py migrate
python manage.py runserver        # Django on :8000

# Worker (separate terminal)
python worker.py                  # RQ workers + health on :8001
python scheduler.py     # periodic scheduler

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                       # Waku dev server on :3000, proxies /api to :8000
```

---

## Environment Variables

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `DOMAIN` | `localhost` | Public domain name (used by nginx for TLS cert paths) |
| `SECRET_KEY` | — | Django secret key (required) |
| `DATABASE_URL` | `mongodb://root:1234@localhost:27017/radar-live?authSource=admin` | MongoDB URI |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis URI |
| `ENV_NAME` | `development` | Shown in `X-App-Version` header |
| `TASK_QUEUE_ENABLED` | `false` | Enable RQ task enqueueing |
| `WORKER_COUNT` | `4` | Number of RQ worker processes |
| `FETCH_INTERVAL_MINUTES` | `10` | How often to fetch new articles |
| `PROCESS_INTERVAL_MINUTES` | `10` | How often to run NLP pipeline |
| `AGGREGATE_INTERVAL_MINUTES` | `10` | How often to aggregate events |

Example `.env` for local dev:

```bash
SECRET_KEY=your-secret-key-here-make-it-long
DATABASE_URL=mongodb://root:1234@localhost:27017/radar-live?authSource=admin
REDIS_URL=redis://localhost:6379/0
ENV_NAME=development
TASK_QUEUE_ENABLED=true
```

---

## Pipeline

```text
fetch_data (every 10m, timeout 30m)
  └─ Telethon / scrapling / requests → Article objects in MongoDB

process_articles (every 10m, timeout 30m)
  └─ HuggingFace NER (dslim/bert-base-NER) — named entity extraction
  └─ VADER — sentiment score [-1, 1]
  └─ mordecai3 — geoparsing (location name + lat/lon)
  └─ BERT cosine similarity (all-MiniLM-L6-v2) — category classification
  └─ → Article NLP fields written back to MongoDB

aggregate_events (every 10m, timeout 30m)
  └─ Clusters articles by location + date + category → Event objects
```

Each stage has a 30-minute hard timeout. RQ kills any job still running when the timeout is reached; the next scheduled cycle starts fresh.

### Event Categories

| Category | Description |
| -------- | ----------- |
| `conflict` | Armed conflict, airstrikes, military operations, casualties |
| `protest` | Demonstrations, civil unrest, strikes, riots |
| `disaster` | Natural or man-made disasters, evacuations, epidemics |
| `political` | Elections, coups, diplomatic events, government decisions |
| `economic` | Trade, markets, inflation, energy, fiscal policy |
| `crime` | Arrests, violence, corruption, trafficking, investigations |
| `general` | Anything below the similarity threshold |

---

## Project Structure

```text
backend/
  app/           WSGI/ASGI entry, root URLs, middleware, auth backend
  core/          Article, Event, Source models + management commands
    models.py    Source, Article, Event + ArticleDocument/ArticleFeatures DTOs
    tasks.py     fetch_articles_job, process_articles_job, aggregate_events_job
    management/
      base.py    BaseTaskCommand — shared base for task-wrapping commands
  accounts/      Custom User model (email-based auth)
  api/           DRF serializers + APIView endpoints
  services/
    cleaner.py      ArticleCleaner — HuggingFace NER + VADER + mordecai3 + BERT categorization
    categorizer.py  BERTSimilarityCategorizer — cosine similarity via sentence-transformers
    location/       Geocoder (mordecai3 + geopy, Django cache)
    data/           Source ingestion helpers (Telethon + scrapling)
  settings/      Django configuration
  worker.py      RQ workers + health check
  scheduler.py   Periodic scheduler (enqueues Workflow tasks)
frontend/        React 19 + Waku SPA (TypeScript)
  src/
    pages/       Waku page components (_layout.tsx, index.tsx)
    components/  App.tsx, MapView.tsx, EventList.tsx, EventCard.tsx
    api/         events.ts — typed fetch helpers
    types.ts     Shared TypeScript types
    constants.ts Category colors and other shared constants
  waku.config.ts Dev proxy /api → localhost:8000
nginx/
  templates/default.conf.template  reverse proxy config (envsubst)
init-letsencrypt.sh  One-time Let's Encrypt bootstrap script
```