# Meeting Copilot

Record any meeting, get a speaker-labelled transcript and a summary, and ask questions across everything you've recorded. Phase 1 of the spec: standups first, any meeting type on the same pipeline.

Every model layer is open source by default and switchable to a paid API with one setting.

| Layer | Open source (default) | Paid drop-in |
| --- | --- | --- |
| Speech to text | faster-whisper (`large-v3-turbo`) | Deepgram Nova-3 |
| Who spoke when | pyannote Community-1 | Deepgram's own speaker labels |
| Summaries and answers | any OpenAI-compatible server (Ollama + `gpt-oss:20b`) | Claude on Amazon Bedrock |
| Search embeddings | Ollama + `nomic-embed-text` | Titan Text Embeddings v2 on Bedrock |
| Storage | Postgres + pgvector, audio on disk | same, audio in S3 |

## How it works

```
 Windows desktop recorder ─┐                       ┌─ worker ───────────────────────────────┐
 (mic + WASAPI loopback)   │   stereo audio        │ normalize (ffmpeg)                       │
                           ├──────────► API ──────►│ split: left = you, right = the meeting   │
 Browser recorder ─────────┘   (FastAPI)  queue    │ transcribe each channel                  │
 (mic + shared system audio)    + web UI  in       │ diarize the meeting channel (pyannote)   │
                                          Postgres │ drop echo of the call picked up by mic   │
                                                   │ summarize by profile (standup / general) │
                                                   │ chunk + embed for search and chat        │
                                                   └──────────────────────────────────────────┘
```

- **You vs. everyone else is free.** Both recorders put your microphone on the left channel and the meeting audio on the right. Your lines are always labelled as you, and diarization only has to separate the other people.
- **The worker is a Postgres queue.** No Redis or SQS. It retries after restarts and runs one meeting at a time, which is right for one user.
- **Two summary profiles ship:** standup (yesterday / today / blockers per person) and general (points, decisions, actions, open questions). Add one in `backend/app/pipeline/profiles.py`.
- **Ask is grounded.** Answers cite the transcript moments and summaries they came from, and link to the exact second. If your meetings don't contain the answer, it says so.
- **Long meetings** are condensed in windows before the final summary, so a 32k-context local model can handle an hour-long call.

## Run it

You need Docker with Compose v2. Start with `make env`, which creates `.env` with a random access token and database password and prints the token.

### 1. Try it with no models (5 minutes, any laptop)

```bash
make env
make demo        # placeholder transcripts and summaries; everything else is real
```

Open http://localhost:8000 and sign in with the token. Record from the browser, upload a file, and click around. The text is canned, but audio handling, speakers, storage, search and the UI all work.

### 2. Fully open source on a GPU machine

Needs an NVIDIA GPU with 16 GB or more (an L4 or RTX 4090 is plenty) and the NVIDIA Container Toolkit.

1. Accept the terms of [`pyannote/speaker-diarization-community-1`](https://huggingface.co/pyannote/speaker-diarization-community-1) on Hugging Face. Put a read token in `HF_TOKEN` in `.env`.
2. Start the stack and download the models:

   ```bash
   make up-gpu
   make pull-models         # gpt-oss:20b + nomic-embed-text into Ollama
   ```

The first meeting takes longer because Whisper and pyannote download their weights into the `models` volume. **CPU only?** It works, but set `WHISPER_MODEL=small.en`. Expect processing to take roughly as long as the meeting itself.

### 3. Paid APIs, no GPU

In `.env`:

```
STT_PROVIDER=deepgram
DEEPGRAM_API_KEY=...
DIARIZER=none
LLM_PROVIDER=bedrock
BEDROCK_MODEL_ID=...        # a Claude model or inference profile enabled in your account
EMBED_PROVIDER=bedrock
EMBED_DIM=1024
```

Give the container AWS credentials (an instance role on EC2, or `AWS_*` variables), then run `make up`.

Mix and match freely. For example, Deepgram for speech with a local LLM for summaries.

### 4. On AWS with Terraform

`infra/terraform` creates:

- one EC2 instance: a GPU Deep Learning AMI for `open_source` mode, Ubuntu for `aws_paid`
- an encrypted S3 bucket for audio, with lifecycle expiry
- secrets in SSM Parameter Store
- daily disk snapshots
- an IAM role scoped to the bucket, its parameters and Bedrock

By default **nothing is exposed to the internet**. You reach the app through an SSM port-forwarding session.

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # set providers_mode, hf_token or deepgram/bedrock
terraform init && terraform apply
terraform output -raw access_token_command | bash   # your sign-in token
terraform output -raw port_forward_command          # run it, keep it open
# then open http://localhost:8000
```

- First boot builds the images and pulls the models, which takes 15–30 minutes. `terraform output setup_log_command` shows how to follow it.
- Set `domain_name` to serve HTTPS publicly through Caddy instead. The app still requires the token.
- After code changes, run `./redeploy.sh`. It ships the new code over SSM without replacing the instance, so your data stays.
- Partition-aware ARNs mean it also works in GovCloud. Check Bedrock model availability there first.

## Record a meeting

**Browser, any OS:** click **Record**, choose *A call on this computer*, and share your **Entire screen** with **Share system audio** turned on. In Chrome/Edge on Windows that captures Teams, Zoom or any app. For a meeting in a browser tab, share that tab with **Share tab audio**. *People in the room* uses only your mic.

**Windows desktop recorder:** captures your mic and the speaker output directly through WASAPI loopback. No screen-share prompt, and it works the same with Teams, Zoom, Webex or a phone app playing through the PC.

- Get `MeetingRecorder.exe` from the **Desktop recorder (Windows)** GitHub Actions run, or build it yourself:
  ```powershell
  cd desktop
  pip install -r requirements-build.txt
  pyinstaller --noconfirm --onefile --windowed --name MeetingRecorder --collect-data soundcard --hidden-import keyring.backends.Windows run_recorder.py
  ```
- Open **Settings**, enter the server address and access token, and use **Test connection**. The token is stored in Windows Credential Manager.
- Recordings are written to `%LOCALAPPDATA%\MeetingCopilot\recordings` and deleted only after the server accepts them. If the network is down they wait there. If the app or PC dies mid-meeting, the partial recording is recovered on next launch.
- `python -m meeting_recorder --fake-audio` runs the app with test tones on any OS.

Use headphones if you can. With speakers, the call leaks into your mic. The server drops those echoed lines, but headphones give cleaner transcripts.

## After a meeting

- **Name the speakers.** The call side shows up as Speaker 1, 2… Type real names in the transcript panel, or use *Same person as…* when one person was split in two. Then click **Regenerate summary**. This is quick because it doesn't re-transcribe.
- **Ticking action items** marks them done everywhere. The Action items page lists open ones across all meetings, with *Only mine*.
- **Retention:** audio is deleted after `AUDIO_RETENTION_DAYS` (30 by default). Transcripts, summaries and search stay.
- **Changing the embedding model** (provider, model or `EMBED_DIM`) needs a rebuilt search index: `docker compose exec api python -m app.manage reindex`. Summaries are kept.

## Privacy and consent

- Both recorders require you to confirm that everyone was told before recording starts. Several US states require all-party consent. Recording coworkers or clients may also need your employer's or client's approval. Don't record meetings whose content your organization restricts.
- Phase 1 stores **no voiceprints**: speakers are separated per meeting only. Voice enrollment (Phase 2) must be opt-in per person, because laws like Illinois BIPA and Texas CUBI regulate voice biometrics.
- With the open-source setup, audio and text never leave your machine or AWS account. With paid APIs, audio goes to Deepgram and text goes to Bedrock under your agreements with them.
- Single-user auth is one bearer token. Keep the app private (the defaults bind to localhost or sit behind SSM). Use the HTTPS profile only if you need remote access.

## Develop

```
backend/   FastAPI API, worker pipeline, providers (Python 3.11+)
web/       React + Vite UI, served by the API in production
desktop/   Windows recorder (Python, Tkinter, soundcard)
infra/     Terraform for AWS
```

- **Backend tests** run against a real Postgres with pgvector and real ffmpeg, using model-free stand-ins. They cover upload → transcribe → diarize → summarize → search/chat, speaker rename and merge, retention, reindex, and error paths:
  ```bash
  cd backend && pip install -r requirements-dev.txt
  TEST_DATABASE_URL=postgresql+psycopg://postgres@localhost:5432/copilot_test python -m pytest
  ```
- **Run locally without Docker:** `make dev-api`, `make dev-worker`, `make dev-web`. Vite proxies `/api` to `:8000`.
- **Recorder tests:** `cd desktop && python -m pytest`. Set `COPILOT_SERVER` and `COPILOT_TOKEN` to also run a live upload against a server.
- **CI** (`.github/workflows`) runs backend tests, the web build and `terraform validate` on Linux, and builds and tests the recorder on Windows.

## Known limits in Phase 1

- No live transcript or live answer card yet. That is Phase 3 in the spec; this phase builds the memory it will draw on.
- Speakers on the call are numbered per meeting until you name them. Recognizing people across meetings is Phase 2.
- Mono in-person recordings rely entirely on diarization. Overlapping speech and distant voices will sometimes be mislabelled. Use rename and merge to fix them.
- What was tested here: the full pipeline with stand-in models, the web UI in Chromium (including recording with fake devices), and the desktop app with test tones.
- What wasn't: the real Whisper, pyannote and Ollama models, real WASAPI capture on Windows, the Docker image builds, and the Terraform apply. Those are the first things to check on your machine.
