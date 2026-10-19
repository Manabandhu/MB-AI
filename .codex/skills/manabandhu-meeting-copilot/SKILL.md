---
name: manabandhu-meeting-copilot
description: Maintain Meeting Copilot under services/meeting-copilot, including the FastAPI backend, post-meeting pipeline (STT, diarization, summaries, embeddings), grounded history chat, the React web app, the Windows desktop recorder, Docker Compose and Terraform deployment. Use for any change to meeting recording, transcripts, meeting memory, or provider swaps.
---

# Meeting Copilot

## Module Purpose and Ownership

Records meetings, produces speaker-labelled transcripts and profile-driven summaries, and answers questions over the user's meeting history with citations. It is a self-contained service: its own Python backend, React web app, desktop recorder and AWS infrastructure. It does not share runtime code, database or auth with the ManaBandhu Spring backend or Expo app.

Source of truth for scope: the "Meeting Copilot — Product & Technical Spec" (Oct 16, 2026). Phase 1 (standup MVP) is the current baseline.

## Layout

- `backend/` FastAPI API (`app.main`), Postgres-queue worker (`app.worker`), pipeline (`app/pipeline`), providers (`app/providers`), tests against real Postgres + pgvector + ffmpeg.
- `web/` React 18 + Vite app, served by the API in production. Uses npm with `package-lock.json`, not the root pnpm workspace.
- `desktop/` Windows recorder (Python, Tkinter, `soundcard` WASAPI loopback).
- `infra/terraform/` single-instance AWS deployment (EC2, S3, SSM, IAM), reachable through SSM port forwarding by default.
- CI: `.github/workflows/meeting-copilot-ci.yml` and `.github/workflows/meeting-copilot-desktop.yml`.

## Invariants

- Every model layer sits behind one interface with an open-source default and a paid drop-in, chosen by one environment variable (`STT_PROVIDER`, `DIARIZER`, `LLM_PROVIDER`, `EMBED_PROVIDER`). `fake` providers keep every code path testable without models.
- Recorders put the user's mic on the left channel and the meeting audio on the right (`channel_layout=mic_system`).
- Answers cite their sources and say when history does not contain the answer; never invent names, numbers or dates.
- Audio is deleted after `AUDIO_RETENTION_DAYS`; text is kept.
- Consent is confirmed before recording.

## Commands

- Backend tests: `cd services/meeting-copilot/backend && TEST_DATABASE_URL=postgresql+psycopg://... python -m pytest`
- Lint: `ruff check app tests`
- Web: `cd services/meeting-copilot/web && npm ci && npm run build`
- Demo stack: `cd services/meeting-copilot && make env && make demo`

## Update Rules

Update this skill in the same commit when providers, tables, API routes, phases delivered, commands, or deployment paths change.
