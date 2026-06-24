# Hand-written: adds Event.topics_source so keyword-fallback topic tags (produced
# when the LLM was unavailable) can be re-evaluated by the LLM on a later run,
# rather than being treated as final. Mirrors the existing router_source pattern.
# New field only — existing events default to '' (untagged) and re-tag normally.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_forecast_v2'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='topics_source',
            field=models.CharField(blank=True, default='', max_length=8),
        ),
    ]
