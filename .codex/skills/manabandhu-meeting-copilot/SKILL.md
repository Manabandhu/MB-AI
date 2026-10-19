---
name: manabandhu-meeting-copilot
description: Maintain Meeting Copilot under services/meeting-copilot, including the FastAPI backend, post-meeting pipeline (STT, diarization, voiceprints, summaries, memory), live assist gateway and answer cards, meeting bots, integrations (Slack, Teams, Jira, GitHub, calendar), tenancy/SSO/RLS, the React web app, the Expo phone app, the Windows desktop recorder, Docker Compose and Terraform deployment. Use for any change to meeting recording, transcripts, meeting memory, live assist, or provider swaps.
---

# Meeting Copilot

## Module Purpose and Ownership

Records meetings, produces speaker-labelled transcripts and profile-driven summaries, keeps a per-workspace memory of people, entities, decisions and commitments, and shows grounded answer cards during live meetings. It is a self-contained service: its own Python backend, web app, phone app, desktop recorder and AWS infrastructure. It shares no runtime code, database or auth with the ManaBandhu Spring backend or Expo app.

Source of truth for scope: "Meeting Copilot — Product & Technical Spec" (Oct 16, 2026). All five roadmap phases are implemented; the four gates are measured by `GET /api/metrics/gates`.

## Layout

- `backend/` FastAPI app (`app.main`): API, live WebSocket gateway, and (same app) the live service; Postgres-queue worker (`app.worker`); `app/pipeline` (audio, transcript, speakers, people, platform labels, profiles, summarize, memory, export, process), `app/providers` (stt, live_stt, diarization, voiceprint, llm, embeddings, bot, fakes), `app/live` (session, detector, cards, hub, upstream), `app/services` (brief, standup, insights, outputs), `app/integrations` (config, activity, notify, jira, calendar), `app/api/*` routers, `migrations/` (Alembic), tests against real Postgres + pgvector + ffmpeg.
- `web/` React 18 + Vite app served by the API. npm with `package-lock.json` (not the root pnpm workspace; excluded from root Biome).
- `mobile/` Expo SDK 57 / React Native 0.86 phone app (record in person, meetings, ask, commitments, live cards with haptics). npm with `package-lock.json`; `overrides` pin `expo-asset`/`expo-constants` to the SDK's versions.
- `desktop/` Windows recorder (Python, Tkinter, `soundcard` WASAPI loopback).
- `infra/terraform/` single-instance AWS deployment (EC2, S3 + KMS, SSM, IAM, snapshots), private behind SSM by default.
- CI: `.github/workflows/meeting-copilot-ci.yml` (backend, web, mobile, terraform) and `meeting-copilot-desktop.yml`.

## Data, tenancy and auth

- Schema changes go through Alembic (`backend/migrations`). `app.db.init_db()` runs `upgrade head` under a Postgres advisory lock at API/worker start-up and stamps Phase 1 databases (tables, no `alembic_version`) at `0001` first. Never use `metadata.create_all`. Generate with `alembic -c alembic.ini revision --autogenerate`, then hand-edit backfills; embedding dimensions come from settings, not literals. Don't edit a released migration; add a new one.
- Every data table mixes in `Tenant` (`workspace_id`, `user_id`) and is listed in `TENANT_TABLES` (and in migration 0002's frozen copy for RLS). Sessions carry a `Scope`: the ORM adds `workspace_id = scope` to every select/update/delete (`do_orm_execute` + `with_loader_criteria`) and fills new rows; Postgres RLS (`tenant_isolation`, `app.workspace_id` / `app.system` set per transaction) enforces the same. Core `Table.update()`/raw SQL bypass the ORM filter: use ORM statements. Use `SYSTEM` only for cross-workspace jobs (claiming queued meetings, purging audio, token lookup, webhooks before the meeting is known).
- Auth (`app/auth.py`): bootstrap `API_TOKEN` owner, hashed personal tokens (`mc_…`), or OIDC JWTs (`OIDC_ISSUER`, audience = `OIDC_CLIENT_ID`). `X-Workspace-Id` selects a shared workspace the caller belongs to. Routes use `get_db` (scoped); `get_system_db` only for signed media links. `audit()` records views, exports, audio access, deletes, voiceprint and integration changes.
- Consent is enforced server-side: no audio, live capture, transcript import or bot join until `consent_state == "confirmed"`; the method is appended to `consent_log`. Transcripts pass through `maybe_redact` (PII). `local_only` meetings fail rather than call any provider listed by `third_party_providers()`.

## Speaker identification (Phase 2)

- Signal order: platform labels (`meetings.platform_turns`, from a bot or an uploaded Teams/Zoom `.vtt`) > mic channel (`me`) > diarization + voiceprints (`app/pipeline/speakers.py`). Platform turns replace diarization; a platform name equal to the owner's name becomes `me`.
- Voiceprints (`VOICEPRINT_PROVIDER`: `speechbrain` ECAPA-TDNN 192-dim, `fake`, `none`) are opt-in: enrollment requires `consent=true`, stores only the embedding (clips are deleted with their temp dir), sets `people.consent_at`, and is audited. Matching compares cluster centroids only against attendees' voiceprints (all enrolled people when there are no attendees), one-to-one above `VOICEPRINT_THRESHOLD`, same embedder model only.
- Corrections (fix-a-line, merge, reassigning a voiceprint/platform match) go to `speaker_corrections`; `GET /api/metrics/speakers` turns them into accuracy and a suggested threshold. Summary hand-edits are counted in `summaries.edit_count` (Phase 1 gate).

## Live assist (Phase 3)

- Gateway: `WS /api/live/{meeting_id}?token=&role=capture|view&channels=` (`app/api/live.py`). Capture sends 16 kHz PCM16LE (stereo: left you, right the meeting) plus JSON commands (ask, explain, pause/resume, translate, caption, feedback, stop); viewers get the same events. Close codes: 4401 bad token, 4403 consent/local-only, 4404 unknown meeting, 4409 already captured.
- `LiveSession`: streaming STT per channel (`LIVE_STT_PROVIDER`: faster_whisper, sherpa_onnx, deepgram, fake, none), live speaker labels (attendee voiceprints, else "Speaker A/B/C"), captions from bots/platforms, triggers → cards, rolling summary every `LIVE_SUMMARY_EVERY_S`, translation, off-the-record (silence written, gap stored in `meetings.off_record`). On stop the recording (or captions) is queued for the post-meeting pipeline; live text never goes straight to memory.
- `TriggerDetector`: name/alias (partials and bare mentions only prefetch), a question aimed at you within `LIVE_QUESTION_WINDOW_S`, watched keywords (user + glossary), explain-a-term, commitment nudges; cooldowns; your own speech never raises an answer card.
- `draft_card`: filter-first retrieval scoped to the profile and attendees, prefetched context, streamed tokens (`card_delta`), grounding check. Below `LIVE_ANSWER_MIN_SCORE`, `NOT_IN_HISTORY`, or ungrounded specifics → "Not in your history — say you'll follow up." Cards store `timings_ms` and feedback (`/api/metrics/live`).
- The hub is in-process: one worker. With `LIVE_UPSTREAM` (Compose `live` service on the worker image), the API proxies the socket and `LiveUpstreamMiddleware` forwards live/bot HTTP routes to that process.
- Briefs `GET /api/meetings/{id}/brief`; standup `POST /api/standup/draft` (Jira/GitHub/CI activity + commitments) and `/rehearse`.

## Profiles and memory (Phase 4)

- Profiles (`app/pipeline/profiles.py`): standup, 1:1, client call, incident, planning/design review, interview, in-person, phone call, general, plus per-workspace custom profiles (prompt + field list). A profile adds `fields` to the common summary shape; `summaries.data.fields_meta` keeps the labels. `profile="auto"` detects at creation and again from the first two minutes; a user override sets `profile_source="user"`.
- After every summary `app/pipeline/memory.py` rebuilds that meeting's entities (LLM + glossary), decisions and commitment mentions. Commitments match open ones of the same owner by word overlap; standup "yesterday" items close them; open + ≥2 meetings over ≥3 days = stuck. Call `forget_meeting` before re-summarizing or deleting a meeting. Action-item ticks and commitment status stay in sync.
- Retrieval (`app/retrieval.py`) filters in SQL first (people, entities, type, dates, "last N calls"), relaxes filters if empty, vector top-k, reranks, caps at `RETRIEVAL_MAX_CONTEXT_CHARS`; commitments, decisions, summaries and documents are citable. `app/grounding.py` flags numbers, dates or names not in the sources.
- Meeting bot (`BOT_PROVIDER`: attendee, vexa, recall, fake, none): joining needs consent (`bot_notice`) and `PUBLIC_BASE_URL`; webhooks are authenticated by our HMAC (`?mid=&sig=`); captions feed the live session; when the bot leaves the worker's `bot` stage fetches recording + per-participant transcript into `platform_turns`.
- `POST /api/meetings/{id}/transcript` imports a text transcript (no audio).

## Teams and integrations (Phase 5)

- Integration settings: `workspaces.settings.integrations` over env defaults (`app/integrations/config.py`); secrets are returned masked and a masked value sent back keeps the stored one; owners only, audited.
- After every summary (`app/services/outputs.py`): Jira drafts per action item (`auto_draft_jira`), one Slack/Teams post (`auto_post_summaries`, `meetings.posted_at`); failures are logged, never fatal. Filing a ticket stores the key on the item and its commitment.
- Calendar: ICS/webcal → `GET /api/calendar/events` (occurrences keyed `uid@start`, detected profile, meeting link) → `POST /api/calendar/prepare` (meeting with consent pending + brief).
- `GET /api/rollup` (JSON/Markdown, timesheet), `GET /api/meetings/{id}/digest`, `GET /api/blocker-radar`.

## Web and phone apps

- Web pages: Meetings (+ "Coming up"), meeting detail (speakers ↔ People, fix-speaker, voiceprint from a cluster, digest, Jira, post, bot, `.vtt`, live cards), Live (`/live`, `/live/:id?capture=meeting|room` or `?view=1`), Ask, Commitments, People (enrollment), Insights (standup, rollup, radar, decisions, gates), Settings (account, tokens, workspaces, integrations, glossary, meeting types, docs, audit). `src/api.ts` sends `X-Workspace-Id`; sockets carry the token as a query parameter; `src/lib/livecapture.ts` streams PCM; `src/lib/oidc.ts` does code + PKCE.
- Phone app: in-person recording only (phones can't capture another app's call audio), explicit start, consent switch; live cards as a second screen with haptics. On-device STT is not built.

## Invariants

- Every model layer has an open-source default and a paid drop-in behind one interface, chosen by one env var; `fake` providers keep every path testable without models. New providers get a fake and a test.
- Recorders put the user's mic on the left channel and the meeting on the right (`channel_layout=mic_system`).
- Answers cite sources and say when history doesn't contain the answer; never invent names, numbers or dates.
- Audio is deleted after `AUDIO_RETENTION_DAYS`; text is kept. Voiceprints are embeddings only, opt-in, deletable.
- No stealth features: bots are visible and named as recording; interview mode stays visible.

## Commands

- Backend: `cd services/meeting-copilot/backend && TEST_DATABASE_URL=postgresql+psycopg://... python -m pytest` and `ruff check app tests migrations`
- Web: `cd services/meeting-copilot/web && npm ci && npm run build`
- Mobile: `cd services/meeting-copilot/mobile && npm ci && npm run typecheck && CI=1 npx expo export --platform android`
- Desktop: `cd services/meeting-copilot/desktop && python -m pytest`
- Stack: `make env && make demo` (fake models) or `make up-gpu`; `make token NAME=desktop`
- Terraform: `terraform fmt -check -recursive && terraform validate` in `infra/terraform`

## Update Rules

Update this skill in the same commit when providers, tables, migrations, API routes, live protocol, consent/privacy rules, commands, or deployment paths change.
