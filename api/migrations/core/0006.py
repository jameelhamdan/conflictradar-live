from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005'),
    ]

    operations = [
        # ── CurrentTopic new fields ────────────────────────────────────────────
        migrations.AddField(
            model_name='currenttopic',
            name='source_ids',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='currenttopic',
            name='started_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='currenttopic',
            name='ended_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='currenttopic',
            name='parent_slug',
            field=models.CharField(blank=True, max_length=128, null=True),
        ),
        # ── Event new field ────────────────────────────────────────────────────
        migrations.AddField(
            model_name='event',
            name='topic_slugs',
            field=models.JSONField(blank=True, default=list),
        ),
        # ── topics default changed dict → keep as JSONField, no schema op needed
        # ── Indexes ───────────────────────────────────────────────────────────
        migrations.AddIndex(
            model_name='currenttopic',
            index=models.Index(fields=['started_at'], name='core_currenttopic_started_idx'),
        ),
        migrations.AddIndex(
            model_name='currenttopic',
            index=models.Index(fields=['ended_at'], name='core_currenttopic_ended_idx'),
        ),
        migrations.AddIndex(
            model_name='currenttopic',
            index=models.Index(fields=['parent_slug'], name='core_currenttopic_parent_idx'),
        ),
    ]
