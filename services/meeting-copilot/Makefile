COMPOSE = docker compose
GPU = -f docker-compose.yml -f docker-compose.gpu.yml

.PHONY: help env up up-local up-gpu pull-models demo logs down test test-backend test-desktop test-mobile web dev-api dev-worker dev-web token

help:
	@echo "make env           create .env from .env.example with random secrets"
	@echo "make up            start db, api, worker (paid APIs or an external model server)"
	@echo "make up-local      same, plus Ollama on CPU"
	@echo "make up-gpu        same, plus Ollama, with the worker and Ollama on the GPU"
	@echo "make pull-models   download the default LLM and embedding model into Ollama"
	@echo "make demo          run with placeholder models (no GPU, no keys)"
	@echo "make token         print a personal access token (NAME=desktop) for the recorder or phone app"
	@echo "make logs | down | test"

env:
	@test -f .env || { cp .env.example .env; \
	  sed -i.bak "s/^API_TOKEN=.*/API_TOKEN=$$(python3 -c 'import secrets;print(secrets.token_urlsafe(32))')/" .env; \
	  sed -i.bak "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$$(python3 -c 'import secrets;print(secrets.token_urlsafe(24))')/" .env; \
	  rm -f .env.bak; echo "Created .env. Your access token:"; grep ^API_TOKEN= .env | cut -d= -f2; }

up: env
	$(COMPOSE) --profile live up -d --build

up-local: env
	$(COMPOSE) --profile live --profile local-llm up -d --build

up-gpu: env
	$(COMPOSE) $(GPU) --profile live --profile local-llm up -d --build

pull-models:
	$(COMPOSE) --profile local-llm exec ollama ollama pull "$$(grep -E '^LLM_MODEL=' .env | cut -d= -f2- || echo gpt-oss:20b)"
	$(COMPOSE) --profile local-llm exec ollama ollama pull "$$(grep -E '^EMBED_MODEL=' .env | cut -d= -f2- || echo nomic-embed-text)"

demo: env
	STT_PROVIDER=fake DIARIZER=fake LLM_PROVIDER=fake EMBED_PROVIDER=fake EMBED_DIM=64 \
	  LIVE_STT_PROVIDER=fake VOICEPRINT_PROVIDER=fake BOT_PROVIDER=fake LIVE_UPSTREAM= \
	  $(COMPOSE) up -d --build
	@echo "Open http://localhost:$${API_PORT:-8000} and sign in with the API_TOKEN from .env"

logs:
	$(COMPOSE) logs -f --tail=100 api worker live

down:
	$(COMPOSE) --profile live --profile local-llm --profile tls down

# ---- development (needs Python 3.11+, Node 22, ffmpeg, and a Postgres with pgvector) ----

test: test-backend test-desktop web test-mobile

test-backend:
	cd backend && python -m pytest

test-desktop:
	cd desktop && python -m pytest

test-mobile:
	cd mobile && npm ci && npm run typecheck

web:
	cd web && npm ci && npm run build

token:
	$(COMPOSE) exec api python -m app.manage create-token "$${NAME:-device}"

dev-api:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-worker:
	cd backend && python -m app.worker

dev-web:
	cd web && npm run dev
