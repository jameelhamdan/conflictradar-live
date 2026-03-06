from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = 'accounts'
    label = 'accounts'  # keeps app_label stable for migrations and AUTH_USER_MODEL
