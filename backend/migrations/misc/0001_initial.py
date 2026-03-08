import django_mongodb_backend.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='EmailLog',
            fields=[
                ('id', django_mongodb_backend.fields.ObjectIdAutoField(
                    auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('to', models.CharField(max_length=254)),
                ('subject', models.CharField(max_length=255)),
                ('email_type', models.CharField(
                    max_length=16,
                    choices=[('confirmation', 'Confirmation'), ('newsletter', 'Newsletter')],
                )),
                ('status', models.CharField(
                    max_length=8,
                    choices=[('sent', 'Sent'), ('failed', 'Failed')],
                )),
                ('error', models.TextField(blank=True, default='')),
                ('sent_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-sent_at'],
            },
        ),
    ]
