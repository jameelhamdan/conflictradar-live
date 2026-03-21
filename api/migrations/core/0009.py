from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008'),
    ]

    operations = [
        migrations.AddField(
            model_name='topic',
            name='event_count',
            field=models.IntegerField(default=0),
        ),
    ]
