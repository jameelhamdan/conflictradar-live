import os
import subprocess
import sys
from pathlib import Path
import app
from celery.schedules import crontab

from decouple import config

BACKEND_DIR = Path(__file__).resolve().parent.parent   # .../backend/
BASE_DIR = BACKEND_DIR.parent                           # project root

# App Versioning
try:
    commit_id = subprocess.check_output(["git", "describe", "--always"], cwd=BASE_DIR).decode('utf-8').strip()
except Exception as e:
    commit_id = ''

VERSION_NUMBER = app.__version__

if commit_id:
    app.__build__ = f'{VERSION_NUMBER}-{commit_id}'
else:
    app.__build__ = f'{VERSION_NUMBER}'

ENV_NAME = config('ENV_NAME', default='development')
VERSION = f'{ENV_NAME}-{app.__build__}'

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False)

ADMINS = (
    ('admin', 'contact@conflictradar.live'),
)

ALLOWED_HOSTS = ['*']
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='http://localhost').split(',')

INSTALLED_APPS = [
    'django_mongodb_backend',
    'apps.MongoAdminConfig',
    'apps.MongoAuthConfig',
    'apps.MongoContentTypesConfig',
    'qsessions',
    'django.contrib.messages',
    'django.contrib.sitemaps',
    'django.contrib.staticfiles',

    'rest_framework',
    'import_export',
    'corsheaders',

    # Apps
    'accounts',
    'core',
    'newsletter',
    'misc',
    'api',
    'services',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'app.middleware.VersionHeaderMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'qsessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

X_FRAME_OPTIONS = 'SAMEORIGIN'
CORS_ALLOWED_ORIGINS = []

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
elif DOMAIN := config('DOMAIN'):
    CORS_ALLOWED_ORIGINS = [f'https://{DOMAIN}']


ROOT_URLCONF = 'app.urls'
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BACKEND_DIR, 'templates'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

SENTRY_DSN = config('DSN', default='')

if SENTRY_DSN:
    import sentry_sdk

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        # Add data like request headers and IP for users,
        # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
        send_default_pii=False,  # Explicitly disable PII
        max_request_body_size="never",  # Don't send request bodies
        include_source_context=False,  # Don't send source code context
        include_local_variables=False,  # Don't send local variable values
    )

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'root': {
        'level': 'INFO',
        'handlers': ['console'],
    },
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s %(filename)s %(funcName)s %(process)d %(thread)d %(threadName)s %(message)s',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    'handlers': {
        'null': {
            'level': 'DEBUG',
            'class': 'logging.NullHandler',
        },
        'console': {
            'level': 'ERROR',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
            'stream': sys.stdout,
        },
        'api_handler': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
            'stream': sys.stdout,
        },
    },
    'loggers': {
        'api': {
            'handlers': ['api_handler'],
            'level': 'INFO',
            'propagate': True,
        },
        'services': {
            'handlers': ['api_handler'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'celery': {
            'handlers': ['api_handler'],
            'level': 'INFO',
            'propagate': False,
        },
        'celery.task': {
            'handlers': ['api_handler'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': True,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.security.DisallowedHost': {
            'handlers': ['null'],
            'propagate': False,
        },
    },
}

# WSGI_APPLICATION = 'app.wsgi_application'
ASGI_APPLICATION = 'app.asgi.application'
# os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

FILE_UPLOAD_MAX_MEMORY_SIZE = 1024
DATA_UPLOAD_MAX_NUMBER_FIELDS = 10000

# Mongo are required
DATABASE_URL = config('DATABASE_URL', default='mongodb://root:1234@localhost:27017/radar-live?authSource=admin')

DATABASES = {
    'default': {
        'ENGINE': 'django_mongodb_backend',
        'HOST': DATABASE_URL,
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    },
    'redis-cache': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/0'),
        'OPTIONS': {
            'MAX_ENTRIES': 10000,
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    },
}

TASK_QUEUE_ENABLED = config('TASK_QUEUE_ENABLED', default=False, cast=bool)

# LLM backend — 'openrouter' (default) or 'ollama'
LLM_BACKEND = config('LLM_BACKEND', default='openrouter')

# OpenRouter (https://openrouter.ai) — used when LLM_BACKEND=openrouter
# Comma-separated lists — multiple keys rotate round-robin; models tried in order on failure
OPENROUTER_API_KEYS = config('OPENROUTER_API_KEYS', default='')
OPENROUTER_MODELS = config('OPENROUTER_MODELS', default='openrouter/free')

# Ollama — used when LLM_BACKEND=ollama
OLLAMA_BASE_URL = config('OLLAMA_BASE_URL', default='')   # e.g. http://my-server:11434
OLLAMA_MODEL = config('OLLAMA_MODEL', default='qwen3')

# ── Celery ────────────────────────────────────────────────────────────────────
_REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')

CELERY_BROKER_URL = _REDIS_URL
CELERY_RESULT_BACKEND = _REDIS_URL
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_ALWAYS_EAGER = not TASK_QUEUE_ENABLED  # run synchronously when queue disabled
CELERY_TASK_EAGER_PROPAGATES = True

_JOB_TIMEOUT = int(config('JOB_TIMEOUT_SECONDS', default=1800))

CELERY_BEAT_SCHEDULE = {
    'fetch-articles': {
        'task': 'services.tasks.fetch_articles_task',
        'schedule': int(config('FETCH_INTERVAL_MINUTES', default=10)) * 60,
    },
    'process-articles': {
        'task': 'services.tasks.process_articles_task',
        'schedule': int(config('PROCESS_INTERVAL_MINUTES', default=10)) * 60,
    },
    'aggregate-events': {
        'task': 'services.tasks.aggregate_events_task',
        'schedule': int(config('AGGREGATE_INTERVAL_MINUTES', default=10)) * 60,
    },
    'tag-topics': {
        'task': 'services.tasks.tag_topics_task',
        'schedule': int(config('TAG_TOPICS_INTERVAL_MINUTES', default=15)) * 60,
    },
    'refresh-topics': {
        'task': 'services.tasks.refresh_topics_task',
        'schedule': crontab(
            hour=int(config('TOPICS_REFRESH_HOUR', default=4)),
            minute=0,
        ),
    },
    'fetch-prices': {
        'task': 'services.tasks.fetch_prices_task',
        'schedule': int(config('PRICE_FETCH_INTERVAL_MINUTES', default=5)) * 60,
    },
    'fetch-notams': {
        'task': 'services.tasks.fetch_notams_task',
        'schedule': int(config('NOTAM_FETCH_INTERVAL_MINUTES', default=15)) * 60,
    },
    'fetch-earthquakes': {
        'task': 'services.tasks.fetch_earthquakes_task',
        'schedule': int(config('EARTHQUAKE_FETCH_INTERVAL_MINUTES', default=5)) * 60,
    },
    'fetch-forex': {
        'task': 'services.tasks.fetch_forex_task',
        'schedule': int(config('FOREX_FETCH_INTERVAL_MINUTES', default=15)) * 60,
    },
    'run-forecasts': {
        'task': 'services.tasks.run_forecast_task',
        'schedule': int(config('FORECAST_INTERVAL_MINUTES', default=60)) * 60,
    },
    'score-forecasts': {
        'task': 'services.tasks.score_forecasts_task',
        'schedule': int(config('FORECAST_SCORE_INTERVAL_MINUTES', default=60)) * 60,
    },
    'generate-newsletter': {
        'task': 'newsletter.tasks.generate_newsletter_task',
        'schedule': crontab(
            hour=int(config('NEWSLETTER_GENERATE_HOUR', default=6)),
            minute=0,
        ),
    },
    'discover-topics': {
        'task': 'services.tasks.discover_topics_task',
        'schedule': int(config('DISCOVER_TOPICS_INTERVAL_MINUTES', default=30)) * 60,
    },
    # TODO: enable after AWS SES is configured
    # 'send-newsletter': {
    #     'task': 'newsletter.tasks.send_newsletter_task',
    #     'schedule': crontab(hour=int(config('NEWSLETTER_SEND_HOUR', default=7)), minute=0),
    # },
}

# Email — provider selection: 'ses' (AWS SES) or 'smtp' (Django SMTP / console)
EMAIL_PROVIDER = config('EMAIL_PROVIDER', default='smtp')

# SMTP settings (used when EMAIL_PROVIDER=smtp)
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='localhost')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

# AWS SES settings (used when EMAIL_PROVIDER=ses)
AWS_SES_ACCESS_KEY_ID = config('AWS_SES_ACCESS_KEY_ID', default='')
AWS_SES_SECRET_KEY = config('AWS_SES_SECRET_KEY', default='')
AWS_SES_REGION = config('AWS_SES_REGION', default='us-east-1')

DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='newsletter@localhost')
NEWSLETTER_BASE_URL = config('NEWSLETTER_BASE_URL', default='http://localhost')

CRON_CLASSES = []

AUTH_USER_MODEL = 'accounts.User'
SESSION_ENGINE = 'qsessions.backends.cached_db'
DEFAULT_AUTO_FIELD = 'django_mongodb_backend.fields.ObjectIdAutoField'
SILENCED_SYSTEM_CHECKS = ['mongodb.E001']
MIGRATION_MODULES = {
    "admin": "migrations.admin",
    "auth": "migrations.auth",
    "contenttypes": "migrations.contenttypes",
    "accounts": "migrations.accounts",
    "core": "migrations.core",
    "newsletter": "migrations.newsletter",
    "misc": "migrations.misc",
}

AUTHENTICATION_BACKENDS = ['app.backends.ModelAuthBackend']

SESSION_COOKIE_AGE = 60 * 60 * 24 * 30  # One month session time

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 9,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-ca'

TIME_ZONE = 'UTC'

# USE_I18N and USE_L10N are deprecated in Django 6.0 (always enabled)
# They are kept here for backward compatibility but have no effect
USE_I18N = False

USE_L10N = False

USE_TZ = True

DATE_FORMAT = 'Y-m-d'
DATETIME_FORMAT = 'Y-m-d H:i'
SHORT_DATE_FORMAT = 'Y-m-d'
SHORT_DATETIME_FORMAT = 'Y-m-d H:i'
TIME_FORMAT = 'H:i'

STATIC_URL = '/django_static/'
STATIC_ROOT = BACKEND_DIR / '.static'

FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
STORAGES = {
    'default': {
        'BACKEND': FILE_STORAGE,
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}
