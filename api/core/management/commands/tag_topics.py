from core.management.base import BaseTaskCommand


class Command(BaseTaskCommand):
    help = 'Tag recent Events with matching active Topics using the LLM'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours', type=int, default=24,
            help='Lookback window in hours (default: 24)',
        )
        parser.add_argument(
            '--force', action='store_true',
            help='Re-evaluate all events in the window, not just untagged ones',
        )
        parser.add_argument(
            '--background', action='store_true',
            help='Enqueue as a background Celery task instead of running directly',
        )

    def handle(self, *args, **kwargs):
        from services.tasks import tag_topics_task

        task_kwargs = dict(hours=kwargs['hours'], force_retag=kwargs['force'])

        if kwargs['background']:
            tag_topics_task.delay(**task_kwargs)
            self.stdout.write(self.style.SUCCESS('Enqueued tag_topics_task'))
            return

        tagged = tag_topics_task(**task_kwargs)
        self.stdout.write(self.style.SUCCESS(f'Tagging complete: {tagged} event(s) processed'))
