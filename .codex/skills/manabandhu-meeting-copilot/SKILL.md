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

## Data, tenancy and auth

- Schema changes go through Alembic (`backend/migrations`). `app.db.init_db()` runs `upgrade head` under a Postgres advisory lock at API and worker start-up, and stamps Phase 1 databases (tables, no `alembic_version`) at `0001` first. Never use `metadata.create_all`. Generate with `alembic -c alembic.ini revision --autogenerate`, then hand-edit backfills; embedding dimensions come from settings, not literals.
- Every data table mixes in `Tenant` (`workspace_id`, `user_id`) and is listed in `TENANT_TABLES`. Sessions carry a `Scope`: the ORM adds `workspace_id = scope` to every select/update/delete and fills new rows; Postgres RLS (`tenant_isolation` policy, `app.workspace_id` / `app.system` set per transaction) enforces the same. Use `SYSTEM` only for cross-workspace jobs (claiming queued meetings, purging audio, token lookup).
- Auth (`app/auth.py`): bootstrap `API_TOKEN` owner, hashed personal tokens (`mc_…`), or OIDC JWTs (`OIDC_ISSUER`). `X-Workspace-Id` selects a shared workspace the caller belongs to. Use `get_db` (scoped) in routes, `get_system_db` only for signed links and webhooks.
- `audit()` records views, exports, audio access and deletes. Consent is enforced server-side: no audio is accepted until `consent_state == "confirmed"`. Transcripts pass through `maybe_redact`. `local_only` meetings fail rather than call a third-party provider.

## Speaker identification (Phase 2)

- Signal order: platform labels (`meetings.platform_turns` from a bot or an uploaded Teams/Zoom `.vtt`) > mic channel (`me`) > diarization + voiceprints (`app/pipeline/speakers.py`). Platform turns replace diarization entirely.
- Voiceprints (`VOICEPRINT_PROVIDER`: `speechbrain` ECAPA-TDNN 192-dim, `fake`, `none`) are opt-in: enrollment requires `consent=true`, stores only the embedding (clips are deleted in a temp dir), sets `people.consent_at`, and is audited. Matching compares cluster centroids only against attendees' voiceprints (all enrolled people when there are no attendees) with one-to-one assignment above `VOICEPRINT_THRESHOLD`; below it the label stays "Speaker N". Only voiceprints from the same embedder model are compared.
- Corrections (fix-a-line, merge, reassigning a voiceprint/platform match) are logged in `speaker_corrections`; `GET /api/metrics/speakers` turns them into accuracy and a suggested threshold. `GET /api/metrics/gates` reports the four roadmap gates; summary hand-edits are counted in `summaries.edit_count`.
- Naming a speaker links or creates a `people` row; attendees join the directory too.

## Live assist (Phase 3)

- Gateway: `WS /api/live/{meeting_id}?token=&role=capture|view&channels=` (`app/api/live.py`). Capture sends 16 kHz PCM16LE (stereo: left you, right the meeting) plus JSON commands; viewers get the same events. Refused without confirmed consent (4403) or a valid token (4401); one capture per meeting (4409). `LIVE_UPSTREAM` proxies sockets to a separate GPU process.
- `LiveSession` (`app/live/session.py`): streaming STT per channel (`LIVE_STT_PROVIDER`: sherpa_onnx, faster_whisper, deepgram, fake, none), live speaker labels (attendee voiceprints, else "Speaker A/B/C" clusters), captions from bots/platforms, triggers → cards, rolling summary every `LIVE_SUMMARY_EVERY_S`, translation, off-the-record pauses (silence written, gap recorded). On stop the recording (or the captions) goes to the post-meeting pipeline; live text never goes straight to memory.
- `TriggerDetector`: name/alias (partials prefetch retrieval), question aimed at you within `LIVE_QUESTION_WINDOW_S`, watched keywords, explain-a-term, commitment nudges; cooldowns keep one card per exchange. Your own speech never raises an answer card.
- `draft_card`: filter-first retrieval scoped to the profile and attendees, prefetched context, streamed tokens (`card_delta`), grounding check; below `LIVE_ANSWER_MIN_SCORE`, NOT_IN_HISTORY or ungrounded specifics → "Not in your history — say you'll follow up." Every card stores `timings_ms` and thumbs feedback (`/api/metrics/live`).
- The hub is in-process: run the API with one worker. Briefs: `GET /api/meetings/{id}/brief`. Standup: `POST /api/standup/draft` (Jira/GitHub/CI activity + commitments) and `/rehearse`.

## Profiles and memory (Phase 4)

- Profiles (`app/pipeline/profiles.py`): standup, 1:1, client call, incident, planning/design review, interview, in-person, phone call, general, plus per-workspace custom profiles (`custom_profiles`: prompt + field list). A profile adds `fields` to the common summary shape; `summaries.data.fields_meta` keeps the labels. `profile="auto"` detects from title/attendees at creation and re-detects from the first two minutes before summarizing; a user override sets `profile_source="user"`.
- After every summary, `app/pipeline/memory.py` rebuilds that meeting's entities (LLM + glossary terms), decisions and commitment mentions. Commitments match open ones of the same owner by word overlap; standup "yesterday" items close them; open + mentioned in ≥2 meetings over ≥3 days = stuck. `forget_meeting` must run before re-summarizing or deleting a meeting. Ticking an action item and changing a commitment stay in sync.
- Retrieval (`app/retrieval.py`) filters in SQL first (people, entities, meeting type, dates, "last N calls"), relaxes filters if empty, then vector top-k, reranks (similarity + word overlap + people + recency) and caps context at `RETRIEVAL_MAX_CONTEXT_CHARS`. Commitments, decisions, summaries and documents are citable sources. `app/grounding.py` flags answers whose numbers, dates or names are not in the sources.
- Meeting bot (`BOT_PROVIDER`: attendee, vexa, recall, fake, none; `app/providers/bot.py`, `app/api/bot.py`): joining needs confirmed consent (the `BOT_NAME` announces recording, logged as `bot_notice`) and `PUBLIC_BASE_URL`. Webhooks are authenticated by our own HMAC (`?mid=&sig=`); captions feed the live session, and when the bot leaves the worker's `bot` stage fetches the recording and per-participant transcript into `platform_turns` before the full pass.
- `POST /api/meetings/{id}/transcript` imports a text transcript (no audio) and runs summarize/memory/index.

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
