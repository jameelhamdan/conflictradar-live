from django.conf import settings


class VersionHeaderMiddleware:
    """
    Attach current application version to response header
    helps with debugging and possibly caching in the future
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['X-App-Version'] = settings.VERSION
        return response
