from django.contrib.auth.backends import ModelBackend as BaseModelBackend


class ModelAuthBackend(BaseModelBackend):
    """
    Custom model authentication backend that uses "can_login" method to login
    """
    def user_can_authenticate(self, user):
        return user.can_login
