# syntax=docker/dockerfile:1

FROM python:3.11-slim-bookworm AS builder

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /build

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN python -m pip install --prefix=/install -r requirements.txt

FROM python:3.11-slim-bookworm AS runtime

# Evitar .pyc y forzar salida de logs sin buffer
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN addgroup --system --gid 10001 appuser \
    && adduser --system --uid 10001 --gid 10001 --no-create-home --disabled-login appuser

COPY --from=builder /install /usr/local

# Copiar el resto del código del microservicio (main.py, modelos .pkl, etc.)
COPY --chown=appuser:appuser . .

# Usuario no privilegiado
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')" || exit 1

# Uvicorn sirviendo la app FastAPI definida en main.py
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
