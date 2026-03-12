from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('newsletter', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='dailynewsletter',
            name='body',
            field=models.TextField(default='', help_text='Newsletter content in Markdown format'),
            preserve_default=False,
        ),
        migrations.RemoveField(
            model_name='dailynewsletter',
            name='html_body',
        ),
        migrations.RemoveField(
            model_name='dailynewsletter',
            name='text_body',
        ),
        migrations.AddField(
            model_name='dailynewsletter',
            name='articles',
            field=models.JSONField(blank=True, default=list, help_text='Snapshot of articles referenced in this newsletter'),
        ),
        migrations.AddField(
            model_name='dailynewsletter',
            name='cover_image_url',
            field=models.URLField(blank=True, max_length=512, null=True),
        ),
        migrations.AddField(
            model_name='dailynewsletter',
            name='cover_image_credit',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
