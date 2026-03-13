from core.management.base import BaseTaskCommand


class Command(BaseTaskCommand):
    help = 'Run NLP pipeline (NER + VADER + categorization) on unprocessed articles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source-code', type=str, default=None,
            help='Restrict to articles from a specific source',
        )
        parser.add_argument(
            '--limit', type=int, default=500,
            help='Max articles to process per run (default: 500)',
        )
        parser.add_argument(
            '--reprocess', action='store_true', default=False,
            help='Re-process already-processed articles',
        )
        parser.add_argument(
            '--background', action='store_true',
            help='Enqueue as a background RQ job instead of running directly',
        )

    def handle(self, *args, **kwargs):
        from services.tasks import process_articles_job

        task_kwargs = dict(
            limit=kwargs['limit'],
            source_code=kwargs.get('source_code'),
            reprocess=kwargs['reprocess'],
        )

        if kwargs['background']:
            process_articles_job.delay(**task_kwargs)
            self.stdout.write(self.style.SUCCESS('Enqueued process_articles_job'))
            return

        count = process_articles_job(**task_kwargs)
        self.stdout.write(self.style.SUCCESS(f'Processed {count} articles'))
