# Meeting Copilot

Record any meeting and get a speaker-labelled transcript and summary. Keep a searchable memory of people, decisions and commitments. When someone asks you something live, get a grounded answer card within seconds, always with its source.

All five phases of the spec are implemented: standup MVP, speaker ID, live assist, every meeting type, and team integrations. Every model layer is open source by default and switchable to a paid API with one setting.

| Layer | Open source (default) | Paid drop-in |
| --- | --- | --- |
| Speech to text, after the meeting | faster-whisper (`large-v3-turbo`) | Deepgram Nova-3 |
| Speech to text, live | faster-whisper `small.en` re-decoded every second, or sherpa-onnx streaming transducers (NeMo FastConformer / Parakeet style) | Deepgram streaming |
| Who spoke when | pyannote Community-1 | Deepgram's speaker labels |
| Voiceprints (opt-in) | SpeechBrain ECAPA-TDNN | — |
| Summaries, answers | any OpenAI-compatible server (Ollama + `gpt-oss:20b`) | Claude on Amazon Bedrock |
| Search embeddings | Ollama + `nomic-embed-text` | Titan Text Embeddings v2 |
| Meeting bot | Attendee or Vexa, self-hosted | Recall.ai, hosted Attendee/Vexa |
| Sign-in | API tokens; any OIDC provider (Keycloak) | Cognito, Entra ID, Okta |
| Storage | Postgres + pgvector, audio on disk | same, audio in S3 (KMS) |

## How it works

```
 Capture                         Audio gateway (WebSocket)            Live path · during the meeting
 ─ browser: mic + shared audio ─┐  consent check, token auth  ┌─► streaming STT per channel
 ─ desktop recorder (Windows)   ├──────────────►──────────────┤   speaker match (voiceprints, else A/B/C)
 ─ phone app (in person)        │  records the full audio      │   triggers: your name, a question for you,
 ─ meeting bot (Teams/Zoom/Meet)┘  + platform captions         │   watched keywords, explain-a-term, "you promised"
                                                               │   answer drafter: filter-first retrieval over
                                                               │   memory → grounded card with source chips
                                                               │
                                     on stop / bot leaves      └─► Post-meeting path · the worker
                                                                   batch re-transcribe, diarize, platform labels,
                                                                   voiceprint matching, profile summary,
                                                                   memory (entities, decisions, commitments),
                                                                   index, Jira drafts, Slack/Teams post
```

- **You vs. everyone else is free.** Recorders put your mic on the left channel and the meeting on the right, so your lines are always yours.
- **The cheapest reliable speaker signal wins.** Platform labels from a bot or a Teams/Zoom `.vtt` beat your mic channel, which beats diarization plus opt-in voiceprints. Below the voiceprint threshold a speaker stays "Speaker 2" until someone names them.
- **Live trades accuracy for speed; memory is only ever written from the accurate post-meeting pass.**
- **Answers never invent.** Retrieval filters in SQL first (people, systems, meeting type, dates, "the last three calls"), then vector search, then reranks. Cards and chat answers whose numbers, dates or names aren't in their sources are replaced with "Not in your history — say you'll follow up" (cards) or flagged (chat).
- **Profiles** change what is summarized and what live assist focuses on: standup, 1:1, client/vendor call, incident bridge, planning/design review (with a draft ADR), interview, in-person, phone call, general, plus your own custom types. The type is detected from the title, attendees and first two minutes, and you can override it.
- **Commitments are tracked across meetings.** "I'll send it Wednesday" becomes a commitment with a resolved due date; the next mention adds to it; "yesterday I sent it" in a standup closes it; anything carried over three days is flagged as stuck.

## Run it

You need Docker with Compose v2. `make env` creates `.env` with a random access token and database password and prints the token.

### 1. Try it with no models (any laptop)

```bash
make env
make demo        # placeholder models; audio, storage, search, live assist and the UI are real
```

Open http://localhost:8000 and sign in with the token. Upload a file, record from the browser, start **Live**, and click around. The text is canned.

### 2. Fully open source on a GPU machine

Needs an NVIDIA GPU with 16 GB or more (an L4 or RTX 4090) and the NVIDIA Container Toolkit.

1. Accept the terms of [`pyannote/speaker-diarization-community-1`](https://huggingface.co/pyannote/speaker-diarization-community-1) on Hugging Face and put a read token in `HF_TOKEN`.
2. `make up-gpu` then `make pull-models`.

This starts Postgres, the API (with the web app), the worker, the **live** service (live STT and answer cards, on the GPU), and Ollama. The API forwards live traffic to the live service (`LIVE_UPSTREAM`). First runs download Whisper, pyannote and SpeechBrain weights into the `models` volume. For sherpa-onnx live STT, download a streaming transducer into a folder, set `LIVE_STT_PROVIDER=sherpa_onnx` and `SHERPA_MODEL_DIR`.

### 3. Paid APIs, no GPU

```
STT_PROVIDER=deepgram            LIVE_STT_PROVIDER=deepgram     DEEPGRAM_API_KEY=...
DIARIZER=none
LLM_PROVIDER=bedrock             BEDROCK_MODEL_ID=...           BEDROCK_LIVE_MODEL_ID=...   # a small fast model for cards
EMBED_PROVIDER=bedrock           EMBED_DIM=1024
```

Give the containers AWS credentials, then `make up`. Mix and match freely.

### 4. On AWS with Terraform

`infra/terraform` creates one EC2 instance (GPU Deep Learning AMI for `open_source`, Ubuntu for `aws_paid`), an encrypted S3 bucket with lifecycle expiry, secrets in SSM Parameter Store, daily snapshots and a scoped IAM role. Nothing is exposed by default; reach the app through SSM port forwarding.

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # providers_mode, hf_token or deepgram/bedrock, optional SSO and bot
terraform init && terraform apply
terraform output -raw access_token_command | bash
terraform output -raw port_forward_command
```

Set `domain_name` to serve HTTPS publicly through Caddy (needed for SSO redirects and bot webhooks). `./redeploy.sh` ships new code without replacing the instance.

## People and sign-in

- **The owner** signs in with `API_TOKEN` (Phase 1 behaviour). **Personal tokens** (`mc_…`) are created in Settings → Account for the desktop recorder, the phone app or scripts; they are stored as hashes. `make token NAME=desktop` prints one from the server.
- **SSO**: set `OIDC_ISSUER` and `OIDC_CLIENT_ID` (a public client with redirect URI `<PUBLIC_BASE_URL>/auth/callback`). The sign-in page offers it; first sign-in creates the user and their personal workspace. `OIDC_ALLOWED_DOMAINS` limits who can join.
- **Workspaces**: everyone has a personal one. Create a team workspace in Settings → Workspace and add members by email; its meetings, people and memory are shared. Switch workspaces from the header.
- **Isolation** is enforced twice: every query is filtered to the caller's workspace in the ORM, and Postgres row-level security enforces the same rule. For RLS to bind, the app must connect as a role that does not own the tables and is not a superuser: create the tables with an admin role (run `python -m app.manage migrate` with it), then point `DATABASE_URL` at a role with `SELECT, INSERT, UPDATE, DELETE` and `NOBYPASSRLS`.

## Recording a meeting

- **Live, in the browser** (any OS, Chrome/Edge): **Live** → *A call on this computer* → share the screen or the meeting's tab with audio. You get the live transcript, rolling summary, answer cards, brief, nudges, an agenda/timebox tracker, a parking lot, live translation, earbud mode (cards read aloud), and **Off the record**, which pauses capture and leaves a visible gap.
- **Send a bot**: **Live** → *Send a bot to the call*, paste the Teams/Zoom/Meet link. Needs `BOT_PROVIDER`, its API key and `PUBLIC_BASE_URL`. The bot is a visible participant named "Meeting Copilot (recording)"; its captions drive live assist; when it leaves, its recording and per-participant names feed the accurate pass. Teams tenants may need admin approval for bots; the recorders are the no-bot path.
- **Record, then process**: **Record** in the browser, the Windows desktop recorder (`desktop/`, WASAPI loopback, no screen share), the phone app (`mobile/`, in person), or upload any audio/video file. A Teams/Zoom transcript (`.vtt`) can name speakers, or stand in for audio entirely.

Every path requires confirming that everyone was told, and the server refuses audio for meetings without confirmed consent. The consent method (tap, verbal, bot notice) is logged on the meeting.

## After a meeting

- **Speakers**: name them or pick them from People; fix a single line with *Fix speaker*; merge duplicates. With the person's consent, *Save voiceprint* builds a voiceprint from their turns so they're recognized next time. People → *Enroll voice* records three short read-aloud clips instead. Only embeddings are stored; anyone can delete a voiceprint.
- **Summary**: profile-specific fields, decisions, action items, entities. Edits are counted (the Phase 1 gate).
- **Memory**: Commitments (open / stuck / overdue / done, with every meeting they came up in), Insights → Decisions, People, and the per-workspace glossary, which also feeds the transcriber's vocabulary and explain-a-term cards.
- **Outputs**: action items get drafted Jira tickets (file each with one click); summaries post to Slack or Teams automatically or on demand; Markdown/JSON export; *Only what concerns me* shows a missed-meeting digest.
- **Insights**: your pre-drafted standup update (Jira, GitHub, CI activity plus last time's commitments) and rehearse mode (tightened to under a minute); weekly/sprint rollups and timesheets (downloadable for retros); the blocker radar (blockers that recur across standups); and the four roadmap **gates**, measured on your own meetings.
- **Calendar**: add an ICS/webcal link in Settings → Integrations; upcoming meetings show on the Meetings page with a detected type and one-click **Prepare**, which creates the meeting and its brief.

## Privacy and security

- All-party consent everywhere by default; the bot's name announces recording; in-person consent is logged on the meeting row; "off the record" leaves a gap.
- Voiceprints are opt-in with explicit consent (Illinois BIPA, Texas CUBI), embeddings only, deletable by anyone.
- Audio auto-deletes after `AUDIO_RETENTION_DAYS` (default 30); text stays unless deleted. Transcripts are PII-redacted (emails, phone, card and SSN numbers) by default. Per-meeting delete.
- Encryption at rest (S3 with KMS, encrypted EBS) and in transit (Caddy TLS); row-level security per workspace; an audit log of who viewed, exported, listened to or deleted what (Settings → Audit log).
- **Sensitive meetings**: mark a meeting local-only and processing fails rather than call any third-party API. The open-source stack keeps everything on your machine or AWS account.
- Interviews and exams stay visible to everyone; there is no stealth overlay. Have counsel check these flows before any public launch, then record the sign-off (Insights → Gates).

## Develop

```
backend/   FastAPI API, worker, live service; Alembic migrations (Python 3.11+)
web/       React + Vite app, served by the API in production
mobile/    Expo (React Native) phone app
desktop/   Windows recorder (Python, Tkinter, soundcard)
infra/     Terraform for AWS
```

- **Backend tests** run against a real Postgres with pgvector and real ffmpeg, using model-free stand-ins (`fake` providers):
  ```bash
  cd backend && pip install -r requirements-dev.txt
  TEST_DATABASE_URL=postgresql+psycopg://postgres@localhost:5432/copilot_test python -m pytest
  ```
  They cover the pipeline, tenancy and row-level security (with a non-superuser role), SSO, consent, audit, PII redaction, voiceprints and corrections, platform labels, profiles and memory, filter-first retrieval and grounding, the live WebSocket gateway end to end, the bot flow, and the integrations.
- **Schema changes**: edit `app/models.py`, then `alembic -c alembic.ini revision --autogenerate -m "..."` and review the migration. API and worker run migrations at start-up; a Phase 1 database is upgraded in place.
- **Run locally without Docker**: `make dev-api`, `make dev-worker`, `make dev-web` (Vite proxies `/api`, including WebSockets).
- **Web**: `cd web && npm ci && npm run build`. **Mobile**: `cd mobile && npm ci && npm run typecheck`. **Recorder**: `cd desktop && python -m pytest`.
- **CI** (`.github/workflows/meeting-copilot-*.yml` at the repo root) runs backend lint and tests, the web build, the mobile typecheck and bundle, `terraform validate`, and builds the Windows recorder.

## What was tested, and what wasn't

- Tested: the full backend with stand-in models (83 tests on Postgres 16 + pgvector); the web app in Chromium against a running stack, including live assist with a fake microphone, answer cards, explain-a-term and off-the-record; the desktop recorder's upload against the new server; the phone app's TypeScript and Android bundle; Compose files and Terraform formatting.
- Not tested here: the real speech, diarization, voiceprint and LLM models; Deepgram/Bedrock/Attendee/Vexa/Recall/Jira/Slack/Teams/GitHub against their live services (their request shapes are unit-tested); the phone app on a device; Docker image builds; `terraform validate`/`apply` (the registry wasn't reachable). Check these first on your machine.
- Thresholds (`VOICEPRINT_THRESHOLD`, `LIVE_ANSWER_MIN_SCORE`) are starting points; calibrate them on your own meetings with Insights → Gates.

## Known limits

- The live hub lives in one process: run the API (or the live service) with a single worker.
- The phone app records in person and shows live cards; on-device STT (sherpa-onnx) and live capture from the phone are not built yet. Watch and TV delivery are future targets.
- The Windows recorder stays a Python app; a Tauri overlay for macOS is not built.
- SSO uses the ID token as the bearer and does not refresh it; you sign in again when it expires.
