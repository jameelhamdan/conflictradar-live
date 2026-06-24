# Hand-written: adds the TaskRun tracking model — one row per pipeline/stream task
# execution, written centrally by the @tracked wrapper in services/queue.py. Data
# source for the admin operations dashboard (throughput stats + in-flight view).

import django_mongodb_backend.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_marketsymbol'),
    ]

    operations = [
        migrations.CreateModel(
            name='TaskRun',
            fields=[
                ('id', django_mongodb_backend.fields.ObjectIdAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('task_name', models.CharField(max_length=128)),
                ('queue', models.CharField(default='default', max_length=16)),
                ('status', models.CharField(choices=[('running', 'Running'), ('success', 'Success'), ('failed', 'Failed'), ('cancelled', 'Cancelled')], default='running', max_length=16)),
                ('started_at', models.DateTimeField()),
                ('finished_at', models.DateTimeField(blank=True, null=True)),
                ('duration_ms', models.IntegerField(blank=True, null=True)),
                ('items', models.IntegerField(blank=True, null=True)),
                ('error', models.TextField(blank=True)),
                ('params', models.JSONField(blank=True, default=dict)),
                ('job_id', models.CharField(blank=True, max_length=64)),
            ],
            options={
                'ordering': ['-started_at'],
                'indexes': [
                    models.Index(fields=['task_name', 'started_at'], name='core_taskru_name_strt_idx'),
                    models.Index(fields=['status'], name='core_taskru_status_idx'),
                    models.Index(fields=['started_at'], name='core_taskru_started_idx'),
                ],
            },
        ),
    ]
