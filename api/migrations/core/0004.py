from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003'),
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='translations',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='event',
            name='translations',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
