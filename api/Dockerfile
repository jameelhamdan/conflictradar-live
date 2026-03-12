FROM python:3.14-slim

COPY ./requirements.txt /requirements.txt

RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends build-essential pkg-config curl \
    && rm -rf /var/lib/apt/lists/*

ENV UV_INDEX_STRATEGY=unsafe-best-match

RUN pip install --no-cache-dir uv \
    && uv venv /py \
    && uv pip install --python /py/bin/python -r /requirements.txt \
    && /py/bin/python -c "from transformers import pipeline; pipeline('token-classification', model='dslim/bert-base-NER', aggregation_strategy='simple')" \
    && adduser --disabled-password djangouser

COPY . /app
WORKDIR /app

ENV PATH="/py/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV CUDA_VISIBLE_DEVICES=""
ENV PYTHONPATH="/app"

RUN chown -R djangouser . && chmod +x ./release.sh ./manage.py

EXPOSE 8000

USER djangouser
