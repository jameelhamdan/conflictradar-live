#!/usr/bin/env python
"""Background worker process pool + queue health check server."""

import os
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, HTTPServer
from multiprocessing import Process, connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings.base")

import django
import django_rq
from django.utils import timezone
from django_rq.management.commands.rqworker import reset_db_connections
from django_rq.queues import get_queue_by_index
from django_rq.settings import QUEUES_LIST
from django_rq.templatetags.django_rq import to_localtime
from redis.exceptions import ConnectionError
from rq.logutils import setup_loghandlers
from rq.worker import SimpleWorker

# Windows has no os.fork() so use SimpleWorker which runs jobs in-process.
_DEFAULT_WORKER_CLASS = SimpleWorker if os.name == "nt" else None

HOST_NAME = "0.0.0.0"
SERVER_PORT = 8001
MAX_JOB_TIMEDELTA = timedelta(minutes=30)


def run_worker(*queue_names, **kwargs):
    print(f'Starting worker {kwargs.get("index", "")}...')
    setup_loghandlers("INFO")
    django.setup()

    if pid := kwargs.get("pid"):
        with open(os.path.expanduser(pid), "w") as fp:
            fp.write(str(os.getpid()))

    worker = django_rq.get_worker(
        *queue_names,
        **{
            "worker_class": kwargs.get("worker_class") or _DEFAULT_WORKER_CLASS,
            "queue_class": kwargs.get("queue_class", None),
            "job_class": kwargs.get("job_class", None),
            "name": kwargs.get("name", None),
            "default_worker_ttl": kwargs.get("default_worker_ttl", 420),
            "serializer": kwargs.get("serializer", "rq.serializers.DefaultSerializer"),
        },
    )

    try:
        reset_db_connections()
        worker.work(
            burst=kwargs.get("burst", False),
            with_scheduler=kwargs.get("with_scheduler", False),
            max_jobs=kwargs.get("max_jobs"),
        )
    except ConnectionError as exc:
        print("Worker Connection Error", str(exc))


def run_healthcheck():
    web_server = HTTPServer((HOST_NAME, SERVER_PORT), HealthCheckServer)
    print(f"Server started. Health check at http://{HOST_NAME}:{SERVER_PORT}")
    web_server.serve_forever()


class HealthCheckServer(BaseHTTPRequestHandler):
    def get_oldest_job_timestamp(self) -> datetime | None:
        oldest_job_timestamp = None
        for index, _ in enumerate(QUEUES_LIST):
            queue = get_queue_by_index(index)
            queue_connection = queue.connection
            last_job_id = queue_connection.lindex(queue.key, 0)
            if not last_job_id:
                continue
            last_job = queue.fetch_job(last_job_id.decode("utf-8"))
            if not last_job:
                continue
            oldest_job_timestamp = to_localtime(last_job.enqueued_at)
        return oldest_job_timestamp

    def return_ok(self):
        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        self.wfile.write(b"ok")

    def return_warning(self):
        self.send_response(429)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        self.wfile.write(b"high usage")

    def do_GET(self):
        oldest_timestamp = self.get_oldest_job_timestamp()
        if oldest_timestamp and timezone.now() > oldest_timestamp + MAX_JOB_TIMEDELTA:
            return self.return_warning()
        return self.return_ok()

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    worker_class = os.getenv("WORKER_CLASS", None)
    worker_count = int(os.getenv("WORKER_COUNT", "4"))

    pool = []

    for index in range(worker_count):
        pool.append(
            Process(
                target=run_worker,
                args=("high", "default", "low"),
                kwargs=dict(
                    worker_class=worker_class,
                    index=index,
                ),
            )
        )

    pool.append(Process(target=run_healthcheck))

    for process in pool:
        process.start()

    connection.wait(process.sentinel for process in pool)

    print("Server stopping...")
    for process in pool:
        process.terminate()
        process.join()
    print("Server stopped.")
