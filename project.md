# Project: radar-live

Live event detection and mapping system. Ingests news articles from multiple sources, runs NLP analysis, clusters them into geolocated events, and displays them on an interactive world map in real time.

---

## Requirements

### Functional

1. **Data Ingestion** — fetch articles from Telegram channels and web sources on a schedule
2. **NLP Processing** — extract locations, sentiment, intensity, and category from each article
3. **Event Aggregation** — cluster articles by location + time + category into Event objects
4. **REST API** — serve events and sources to the frontend via DRF serializers
5. **Live Map** — display events as markers on a Leaflet map, colored by category and sized by intensity
6. **Filtering** — filter events by category, date range, and bounding box
7. **Event Detail** — drill into an event to see contributing articles with links to sources
8. **Auto-refresh** — frontend polls for new events every 60 seconds without full page reload

### Non-Functional

- All pipeline stages run every **10 minutes** with a **30-minute hard timeout**; RQ kills any job still running after 30 minutes and the next cycle starts fresh
- API response time < 500ms for typical event list queries
- Frontend works on modern browsers (Chrome, Firefox, Safari latest)
- Docker Compose starts the full stack with a single `docker compose up`
- HTTPS via Let's Encrypt with automatic cert renewal
- Stateless backend workers — all shared state in MongoDB or Redis

---

## Architecture

```text
Browser
  └── nginx (:80 / :443)          reverse proxy + TLS termination
        ├── /api/         → backend:8000   Django REST API (DRF)
        ├── /admin/       → backend:8000   Django admin
        ├── /django_static/ → backend:8000 Whitenoise static files
        └── /             → frontend:80  React SPA

backend (uvicorn :8000)
  ├── services/api/       DRF serializers + APIView endpoints
  ├── services/accounts/  Custom User model
  └── core/               Article, Event, Source models (MongoDB)

worker (python worker.py)
  ├── 4× RQ workers       process high / default / low queues
  ├── Scheduler           enqueues jobs every 10 minutes
  └── Health check        HTTP :8001

certbot                   auto-renews Let's Encrypt certs every 12 hours

MongoDB 8 (:27017)        all data storage
Redis (:6379)             RQ job queues + sessions cache
```

---

## Pipeline

### Stage 1 — fetch_data (every 10m, timeout 30m)

- Reads all configured `Source` objects
- Fetches new messages via Telethon (Telegram) or HTTP requests
- Deduplicates by content hash
- Writes raw `Article` objects to MongoDB

### Stage 2 — process_articles (every 10m, timeout 30m)

- Queries unprocessed Articles (`processed_on=null`)
- Runs spaCy NER to extract entities and location
- Runs VADER to compute sentiment score
- Geocodes location string to lat/lng via geopy
- Scores event intensity from keyword heuristics
- Classifies category via rule-based classifier
- Writes NLP fields back to Article, sets `processed_on`

### Stage 3 — aggregate_events (every 10m, timeout 30m)

- Queries Articles processed since last aggregation
- Groups by (location_name, category, time window)
- Creates or updates `Event` objects
- Writes `article_ids`, counts, averages back to Event

Jobs are enqueued to Redis via RQ with `job_timeout=1800`. The scheduler in `worker.py` enqueues each independently; if a job is still running when the next cycle fires, RQ kills it.

---

## API Endpoints

All responses are serialized by DRF. Dates are ISO 8601 UTC strings.

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/events/` | List events — `category`, `start`, `end`, `limit`, `bbox` query params |
| GET | `/api/events/<id>/` | Event detail + contributing articles |
| GET | `/api/sources/` | List configured sources |

---

## Data Models

### Source

Configuration for a data source (Telegram channel, RSS feed, web API).

| Field | Type | Notes |
| ----- | ---- | ----- |
| code | CharField | Unique identifier |
| type | SourceType | TELEGRAM, RSS, API, WEBSITE, … |
| name | CharField | Display name |
| url | URLField | Optional |
| author_slug | CharField | Telegram channel username |
| headers | JSONField | API credentials (TELEGRAM_API_ID, etc.) |

### Article

A single news item fetched from a source.

| Field | Type | Notes |
| ----- | ---- | ----- |
| id | UUIDField | PK, auto uuid4 |
| source_code | CharField | FK-like reference to Source.code |
| title | CharField | |
| content | TextField | |
| published_on | DateTimeField | |
| entities | JSONField | spaCy NER output |
| sentiment | FloatField | VADER compound score |
| location | CharField | Extracted place name |
| latitude / longitude | FloatField | Geocoded coordinates |
| event_intensity | FloatField | Severity score 0–1 |
| category | EventCategory | Rule-based classification |
| processed_on | DateTimeField | Set after NLP pipeline runs |

### Event

An aggregated event derived from one or more Articles at the same location.

| Field | Type | Notes |
| ----- | ---- | ----- |
| title | CharField | Summarised from articles |
| category | EventCategory | Dominant category |
| location_name | CharField | Geocoded place name |
| latitude / longitude | FloatField | |
| started_at | DateTimeField | Earliest article timestamp |
| article_count | IntegerField | |
| avg_sentiment | FloatField | |
| avg_intensity | FloatField | 0–1 |
| article_ids | JSONField | List of Article UUID strings |
| source_codes | JSONField | List of source codes |

---

## Frontend

### Map

- CartoDB dark tiles, initial view: world zoom 2
- `CircleMarker` per event — color = category, radius = `6 + intensity × 14`
- Click marker → select event, fly map to it, highlight card in list

### Event List

- Fixed-width side panel (380px)
- Scrolls independently of map
- Selecting a card flies the map to that event's marker

### EventCard

- Shows: category badge, time-ago, title, location, article count, intensity bar
- Expand button lazy-loads contributing articles with source links via `/api/events/<id>/`

### Filters

- Category dropdown, start/end date inputs
- Sent as query params to `/api/events/`
- Clear button resets all filters

### Polling

- `setInterval` every 60 seconds re-fetches `/api/events/` with current filters

---

## Docker Services

| Service | Exposed | Role |
| ------- | ------- | ---- |
| nginx | :80, :443 | Reverse proxy + TLS termination |
| certbot | — | Let's Encrypt cert renewal (every 12h) |
| backend | internal :8000 | Django + uvicorn |
| worker | :8001 | RQ workers + scheduler + health check |
| frontend | internal :80 | React SPA (nginx:alpine) |
| mongo | :27017 | Database |
| redis | internal | Queue + cache |

---

## Deployment

### HTTP-only (local / no domain)

```bash
DOMAIN=localhost docker compose up --build

docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

Access at <http://localhost>.

### HTTPS with Let's Encrypt (production)

Run once to bootstrap certificates, then start the full stack:

```bash
export DOMAIN=yourdomain.com
export CERTBOT_EMAIL=admin@yourdomain.com

bash init-letsencrypt.sh           # one-time cert setup
DOMAIN=$DOMAIN docker compose up -d
```

Certs auto-renew every 12 hours via the `certbot` service.

Access:

- Site: <https://yourdomain.com>
- API: <https://yourdomain.com/api/>
- Admin: <https://yourdomain.com/admin/>
- Worker health: <http://yourdomain.com:8001/>
