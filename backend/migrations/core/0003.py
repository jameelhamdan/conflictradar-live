from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='sub_categories',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
