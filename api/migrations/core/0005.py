from django.db import migrations, models
import django_mongodb_backend.fields


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004'),
    ]

    operations = [
        migrations.CreateModel(
            name='CurrentTopic',
            fields=[
                ('id', django_mongodb_backend.fields.ObjectIdAutoField(
                    auto_created=True, primary_key=True, serialize=False, verbose_name='ID'
                )),
                ('slug', models.CharField(max_length=128, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('keywords', models.JSONField(blank=True, default=list)),
                ('description', models.TextField(blank=True)),
                ('category', models.CharField(
                    blank=True, max_length=64,
                    choices=[
                        ('conflict', 'Conflict'), ('protest', 'Protest'),
                        ('disaster', 'Disaster'), ('political', 'Political'),
                        ('economic', 'Economic'), ('crime', 'Crime'),
                        ('general', 'General'),
                    ],
                )),
                ('source_url', models.URLField(blank=True, max_length=512)),
                ('is_active', models.BooleanField(default=True)),
                ('fetched_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['name'],
                'indexes': [
                    models.Index(fields=['is_active'], name='core_currenttopic_active_idx'),
                    models.Index(fields=['category'],  name='core_currenttopic_cat_idx'),
                ],
            },
        ),
        migrations.AddField(
            model_name='event',
            name='topics',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
