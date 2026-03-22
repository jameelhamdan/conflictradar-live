FROM python:3.13-slim

COPY ./requirements.txt /requirements.txt

RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends build-essential pkg-config curl \
    && rm -rf /var/lib/apt/lists/*

# Store HF model cache inside /py so it's readable by all users
ENV HF_HOME=/py/huggingface
ENV UV_INDEX_STRATEGY=unsafe-best-match

COPY ./init_models.py /init_models.py

RUN pip install --no-cache-dir uv \
    && uv venv /py \
    && uv pip install --python /py/bin/python -r /requirements.txt \
    && /py/bin/python /init_models.py \
    && adduser --disabled-password djangouser \
    && chown -R djangouser /py/huggingface

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
