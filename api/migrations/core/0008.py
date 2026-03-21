from django_mongodb_backend.fields import ObjectIdAutoField
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007'),
    ]

    operations = [
        migrations.CreateModel(
            name='Forecast',
            fields=[
                ('id', ObjectIdAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('symbol', models.CharField(max_length=32)),
                ('stream_key', models.CharField(max_length=32)),
                ('generated_at', models.DateTimeField()),
                ('horizon_hours', models.IntegerField(default=4)),
                ('direction', models.CharField(
                    max_length=16,
                    choices=[('up', 'Up'), ('down', 'Down'), ('neutral', 'Neutral')],
                )),
                ('confidence', models.FloatField()),
                ('predicted_value', models.FloatField(blank=True, null=True)),
                ('actual_value', models.FloatField(blank=True, null=True)),
                ('model_name', models.CharField(max_length=128)),
                ('reasoning', models.TextField(blank=True)),
                ('event_ids', models.JSONField(default=list)),
                ('feature_vector', models.JSONField(default=dict)),
            ],
            options={
                'ordering': ['-generated_at'],
            },
        ),
        migrations.AddIndex(
            model_name='forecast',
            index=models.Index(fields=['symbol', 'generated_at'], name='core_forecast_symbol_gen_idx'),
        ),
        migrations.AddIndex(
            model_name='forecast',
            index=models.Index(fields=['stream_key'], name='core_forecast_stream_key_idx'),
        ),
        migrations.AddIndex(
            model_name='forecast',
            index=models.Index(fields=['generated_at'], name='core_forecast_generated_at_idx'),
        ),
    ]
