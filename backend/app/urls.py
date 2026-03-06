from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/django-rq/', include('django_rq.urls')),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
