import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings.base')

from django.core.asgi import get_asgi_application  # noqa: E402

application = get_asgi_application()
