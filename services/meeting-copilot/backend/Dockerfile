# syntax=docker/dockerfile:1
# Build from the repo root:  docker build -f backend/Dockerfile --target api .
#
#   api     FastAPI + the built web UI. Small: no ML libraries.
#   worker  The pipeline, with faster-whisper and pyannote. TORCH_INDEX picks CPU or CUDA wheels.

FROM node:22-slim AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
RUN npm run build

FROM python:3.12-slim AS api
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt
COPY backend/app ./app
COPY --from=web /web/dist ./web
ENV WEB_DIST_DIR=/app/web \
    STORAGE_DIR=/data/audio
RUN useradd --create-home --uid 10001 copilot \
    && mkdir -p /data/audio \
    && chown -R copilot /data
USER copilot
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=4)" || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]

FROM api AS worker
USER root
ARG TORCH_INDEX=https://download.pytorch.org/whl/cpu
COPY backend/requirements-ml.txt ./
RUN pip install torch torchaudio --index-url ${TORCH_INDEX} \
    && pip install -r requirements-ml.txt
COPY backend/docker/worker-entrypoint.sh /usr/local/bin/worker-entrypoint
RUN chmod +x /usr/local/bin/worker-entrypoint \
    && mkdir -p /models \
    && chown copilot /models
# Model downloads (Whisper, pyannote) are cached here; mount a volume so they survive rebuilds.
ENV HF_HOME=/models/huggingface
USER copilot
HEALTHCHECK NONE
ENTRYPOINT ["worker-entrypoint"]
CMD ["python", "-m", "app.worker"]
