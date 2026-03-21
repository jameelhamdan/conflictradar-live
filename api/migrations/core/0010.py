from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009'),
    ]

    operations = [
        migrations.AddField(
            model_name='topic',
            name='topic_score',
            field=models.FloatField(default=0.0),
        ),
        migrations.AddField(
            model_name='topic',
            name='is_pinned',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='topic',
            name='is_top_level',
            field=models.BooleanField(default=False),
        ),
    ]
