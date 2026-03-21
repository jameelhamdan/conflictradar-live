from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006'),
    ]

    operations = [
        # Rename CurrentTopic → Topic (MongoDB: renames the collection)
        migrations.RenameModel(
            old_name='CurrentTopic',
            new_name='Topic',
        ),

        # is_current flag: True = actively in today's news cycle
        migrations.AddField(
            model_name='topic',
            name='is_current',
            field=models.BooleanField(default=True),
        ),

        # Calendar anchor for "On This Day" historical topics
        migrations.AddField(
            model_name='topic',
            name='historical_month',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='topic',
            name='historical_day',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='topic',
            name='historical_year',
            field=models.IntegerField(blank=True, null=True),
        ),

        # Indexes
        migrations.AddIndex(
            model_name='topic',
            index=models.Index(fields=['is_current'], name='core_topic_is_current_idx'),
        ),
        migrations.AddIndex(
            model_name='topic',
            index=models.Index(
                fields=['historical_month', 'historical_day'],
                name='core_topic_hist_month_day_idx',
            ),
        ),
    ]
