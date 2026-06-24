# Hand-written: adds per-record stage_status JSON to Article and Event so each
# pipeline step's outcome (ok/at/error) is recorded per record. Makes the *reason*
# a step is missing visible (not just that it's missing) and feeds the dashboard's
# pipeline-coverage panel. New field only — existing rows default to {} and backfill
# their stage status on the next reprocess.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_taskrun'),
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='stage_status',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='event',
            name='stage_status',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
