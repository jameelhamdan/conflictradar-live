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
    ]
