"""One live meeting: the audio gateway's per-meeting state.

Input (from the capture client, a meeting bot or a platform caption feed):
  - audio: 16 kHz PCM16 little-endian, interleaved. Two channels = left your mic, right the meeting.
  - captions: already-transcribed text with a speaker name (bot, Teams/Zoom captions)
  - commands: ask, pause/resume (off the record), explain, translate, feedback, stop

Output events (to every viewer of the meeting):
  notice, brief, nudges, partial, final, card, card_delta, summary, translation, state, error, stopped

The live path trades accuracy for speed. On stop, the recorded audio (with silence where the meeting
was off the record) goes through the post-meeting pipeline, which re-transcribes, re-diarizes and
re-labels everything before anything reaches memory.
"""

import logging
import tempfile
import threading
import time
from collections.abc import Callable
from pathlib import Path

import numpy as np
import soundfile as sf
from sqlalchemy import select

from ..auth import Principal
from ..config import Settings
from ..db import new_session
from ..models import Commitment, CommitmentStatus, GlossaryTerm, Meeting, MeetingStatus, Person, User, utcnow
from ..pipeline.memory import is_stuck
from ..pipeline.people import attendee_people
from ..pipeline.process import save_transcript, workspace_vocabulary
from ..pipeline.profiles import get_profile
from ..pipeline.transcript import OWNER_LABEL, Line, relabel_with_map
from ..privacy import maybe_redact, third_party_providers
from ..providers import LLM, Embedder, ProviderError, SpeakerEmbedder, StreamingTranscriber
from ..providers.live_stt import SR, LiveText
from ..providers.voiceprint import cosine, mean_embedding
from ..retrieval import build_sources, parse_filters
from ..storage import Storage
from .cards import CardContext, commitment_card, draft_card, glossary_card, update_card
from .detector import Trigger, TriggerDetector

log = logging.getLogger(__name__)

ROLLING_SYSTEM = """TASK: rolling-summary
Summarize the last few minutes of this meeting in at most 4 short bullet points ("- ..."): updates, decisions,
commitments and open questions. Use only what was said."""

TRANSLATE_SYSTEM = """TASK: translate
Translate the line into {lang}. Keep names, numbers and system names unchanged. Return only the translation."""

RING_S = 30  # seconds of audio kept per channel for live speaker matching


class LiveSession:
    def __init__(
        self,
        meeting_id: str,
        principal: Principal,
        settings: Settings,
        *,
        stt: StreamingTranscriber,
        llm: LLM,
        embedder: Embedder,
        voiceprints: SpeakerEmbedder | None,
        storage: Storage,
        emit: Callable[[dict], None],
        spawn: Callable[[Callable[[], None]], None] | None = None,
        channels: int = 2,
    ):
        self.meeting_id = meeting_id
        self.principal = principal
        self.scope = principal.scope
        self.settings = settings
        self.stt, self.llm, self.embedder, self.voiceprints = stt, llm, embedder, voiceprints
        self.storage = storage
        self.emit = emit
        self.spawn = spawn or (lambda fn: fn())
        self.channels = channels if channels in (1, 2) else 1
        self.lock = threading.Lock()
        self.lines: list[dict] = []
        self.started_at = time.monotonic()
        self.audio_s = 0.0
        self.off_record = False
        self.off_since = 0.0
        self.gaps: list[list[float]] = []
        self.translate_to: str | None = None
        self.last_summary_at = 0.0
        self.summarized_upto = 0
        self.prefetched = []
        self.streams: dict[int, object] = {}
        self.rings: dict[int, tuple[float, np.ndarray]] = {}
        self.clusters: list[tuple[str, list[float]]] = []  # live "Speaker A/B/C" centroids
        self.stopped = False
        self._tmp = tempfile.TemporaryDirectory(prefix="live-")
        self.wav_path = Path(self._tmp.name) / "live.wav"
        self._wav: sf.SoundFile | None = None
        self.has_audio = False
        self._load()

    # ------------------------------------------------------------------------------ set-up

    def _load(self) -> None:
        with new_session(self.scope) as db:
            m = db.get(Meeting, self.meeting_id)
            if m is None:
                raise LookupError("meeting not found")
            if m.consent_state != "confirmed":
                raise PermissionError("consent has not been confirmed for this meeting")
            if m.local_only and third_party_providers(self.settings, live=True):
                raise PermissionError("this meeting is local-only, but live assist would use a third-party provider")
            self.title = m.title
            self.profile = get_profile(m.profile, db)
            self.attendees = attendee_people(db, m.attendees or [])
            user = db.get(User, self.principal.user_id)
            me = db.scalars(select(Person).where(Person.account_user_id == self.principal.user_id)).all()
            my_ids = {p.id for p in me}
            self.owner_names = [self.principal.display_name, *(user.aliases or [])] + [
                a for p in me for a in (p.aliases or [])
            ]
            terms = db.scalars(select(GlossaryTerm)).all()
            self.keywords = list(dict.fromkeys([*(user.watched_keywords or []), *(t.term for t in terms if t.watched)]))
            explain = {t.term.lower(): t.definition for t in terms}
            explain |= {a.lower(): t.definition for t in terms for a in (t.aliases or [])}
            now = utcnow()
            commitments = []
            attendee_ids = {p.id for p in self.attendees}
            for c in db.scalars(select(Commitment).where(Commitment.status == CommitmentStatus.OPEN)).all():
                mine = c.owner_person_id in my_ids or (c.owner or "").lower() == self.principal.display_name.lower()
                if mine or c.owner_person_id in attendee_ids:
                    last = db.get(Meeting, c.last_meeting_id) if c.last_meeting_id else None
                    commitments.append(
                        {
                            "id": c.id,
                            "owner": c.owner,
                            "text": c.text,
                            "due": c.due,
                            "mine": mine,
                            "stuck": is_stuck(c, now),
                            "meeting_id": c.last_meeting_id,
                            "meeting_title": last.title if last else "",
                            "said_at": c.last_mentioned_at.isoformat(),
                        }
                    )
            self.commitments = commitments
            self.vocabulary = workspace_vocabulary(db)
            self.attendee_prints = []
            if self.voiceprints is not None:
                from ..models import Voiceprint

                for p in self.attendees:
                    vps = db.scalars(
                        select(Voiceprint).where(
                            Voiceprint.person_id == p.id, Voiceprint.model == self.voiceprints.name
                        )
                    ).all()
                    if vps and p.consent_at:
                        self.attendee_prints.append((p.display_name, mean_embedding([list(v.embedding) for v in vps])))
            m.status, m.source, m.stage = MeetingStatus.LIVE, "live", "live"
            m.consent_log = [
                *(m.consent_log or []),
                {"method": "live_notice", "at": now.isoformat(), "by": self.principal.display_name},
            ]
            db.commit()
        self.detector = TriggerDetector(
            owner_names=self.owner_names,
            keywords=self.keywords,
            terms=explain,
            commitments=commitments,
            window_s=self.settings.live_question_window_s,
        )
        self.ctx = CardContext(
            self.scope, self.meeting_id, self.principal.display_name, self.profile, [p.id for p in self.attendees]
        )

    def start(self) -> None:
        """Consent notice, then the brief, nudges and (for standups) your pre-filled update."""
        self.emit(
            {
                "type": "notice",
                "text": "Recording with live assist is on. Everyone in this meeting must know "
                "it is being recorded; use Off the record to pause.",
                "profile": self.profile.key,
            }
        )
        nudges = [c for c in self.commitments if c["mine"] or c["stuck"]][:6]
        if nudges:
            self.emit({"type": "nudges", "items": nudges})
        self.spawn(self._prepare)

    def _prepare(self) -> None:
        from ..services.brief import build_brief

        try:
            with new_session(self.scope) as db:
                m = db.get(Meeting, self.meeting_id)
                brief = build_brief(db, m, self.principal, self.settings, llm=self.llm, embedder=self.embedder)
                db.rollback()  # the brief only reads (attendee people were flushed at start-up)
            self.emit({"type": "brief", "brief": brief})
            update = next((f for f in brief["focus"] if f["kind"] == "your_update"), None)
            if update:
                self.emit({"type": "card", "card": update_card(self.ctx, {**update["draft"], "text": update["text"]})})
            # Pre-fetch likely context so the first card doesn't wait on a cold retrieval.
            seed = " ".join([self.title, *(p.display_name for p in self.attendees)])
            with new_session(self.scope) as db:
                f = parse_filters(db, seed, owner_name=self.principal.display_name)
                self.prefetched, _ = build_sources(db, self.embedder, seed, f, self.settings, k=4)
        except ProviderError as e:
            self.emit({"type": "error", "text": f"Couldn't prepare the brief: {e}"})

    # -------------------------------------------------------------------------------- audio

    def _stream(self, channel: int):
        if channel not in self.streams:
            try:
                self.streams[channel] = self.stt.open(self.vocabulary)
            except ProviderError as e:
                self.streams[channel] = None
                self.emit({"type": "error", "text": str(e)})
        return self.streams[channel]

    def _ring(self, channel: int, audio: np.ndarray, t_end: float) -> None:
        start, buf = self.rings.get(channel, (0.0, np.zeros(0, dtype=np.float32)))
        buf = np.concatenate([buf, audio])
        if len(buf) > SR * RING_S:
            drop = len(buf) - SR * RING_S
            buf, start = buf[drop:], start + drop / SR
        self.rings[channel] = (start, buf)

    def feed_audio(self, pcm: bytes) -> None:
        if self.stopped or not pcm:
            return
        samples = np.frombuffer(pcm[: len(pcm) - len(pcm) % (2 * self.channels)], dtype="<i2")
        frames = samples.reshape(-1, self.channels)
        if self._wav is None:
            self._wav = sf.SoundFile(str(self.wav_path), "w", samplerate=SR, channels=self.channels, subtype="PCM_16")
        if self.off_record:  # keep the timeline, keep nothing that was said
            self._wav.write(np.zeros_like(frames))
            self.audio_s += len(frames) / SR
            return
        self._wav.write(frames)
        self.has_audio = True
        self.audio_s += len(frames) / SR
        floats = frames.astype(np.float32) / 32768.0
        for ch in range(self.channels):
            audio = floats[:, ch]
            self._ring(ch, audio, self.audio_s)
            stream = self._stream(ch)
            if stream is None:
                continue
            t = time.monotonic()
            results = stream.accept(audio)
            stt_ms = round((time.monotonic() - t) * 1000)
            for r in results:
                self._on_text(ch, r, stt_ms)
        self._maybe_summarize()

    def _who(self, channel: int, r: LiveText) -> tuple[str, bool]:
        if self.channels == 2 and channel == 0:
            return self.principal.display_name, True
        return self._match_speaker(channel, r), False

    def _match_speaker(self, channel: int, r: LiveText) -> str:
        """Attendee voiceprints first; otherwise group voices into Speaker A, B, C..."""
        if self.voiceprints is None or r.kind != "final" or r.end - r.start < 0.8:
            return self.clusters[-1][0] if self.clusters else "Speaker A"
        start, buf = self.rings.get(channel, (0.0, np.zeros(0, dtype=np.float32)))
        a, b = int((r.start - start) * SR), int((r.end - start) * SR)
        seg = buf[max(0, a) : max(0, b)]
        if len(seg) < SR * 0.8:
            return self.clusters[-1][0] if self.clusters else "Speaker A"
        try:
            vec = self.voiceprints.embed_audio(seg, SR)
        except ProviderError:
            return "Speaker A"
        best = max(((cosine(vec, v), name) for name, v in self.attendee_prints), default=(0.0, ""))
        if best[0] >= self.settings.voiceprint_threshold:
            return best[1]
        near = max(((cosine(vec, v), name) for name, v in self.clusters), default=(0.0, ""))
        if near[0] >= self.settings.voiceprint_threshold:
            return near[1]
        name = f"Speaker {chr(ord('A') + len(self.clusters) % 26)}"
        self.clusters.append((name, vec))
        return name

    def _on_text(self, channel: int, r: LiveText, stt_ms: int = 0) -> None:
        speaker, is_owner = self._who(channel, r)
        text = maybe_redact(r.text, self.settings)
        if r.kind == "partial":
            self.emit(
                {
                    "type": "partial",
                    "channel": channel,
                    "speaker": speaker,
                    "text": text,
                    "t": r.start,
                    "stt_ms": stt_ms,
                }
            )
            trig = self.detector.partial(speaker, is_owner, text, r.end)
            if trig is not None:
                self._prefetch(trig)
            return
        self.add_line(speaker, text, r.start, r.end, is_owner=is_owner, channel=channel)

    # ----------------------------------------------------------------------------- captions

    def feed_caption(
        self, speaker: str, text: str, start: float | None = None, end: float | None = None, final: bool = True
    ) -> None:
        """Text from a meeting bot or platform captions. Speaker names come from the platform."""
        if self.stopped or self.off_record or not text.strip():
            return
        now = time.monotonic() - self.started_at
        start = now if start is None else start
        end = start + 2.0 if end is None else end
        is_owner = any(speaker.strip().lower() == n.lower() for n in self.owner_names)
        if not final:
            self.emit({"type": "partial", "channel": None, "speaker": speaker, "text": text, "t": start})
            trig = self.detector.partial(speaker, is_owner, text, end)
            if trig:
                self._prefetch(trig)
            return
        self.add_line(speaker, maybe_redact(text, self.settings), start, end, is_owner=is_owner, channel=None)
        self._maybe_summarize(now=end)

    def add_line(self, speaker: str, text: str, start: float, end: float, *, is_owner: bool, channel) -> None:
        with self.lock:
            line = {
                "id": len(self.lines) + 1,
                "speaker": speaker,
                "is_owner": is_owner,
                "start": round(start, 2),
                "end": round(end, 2),
                "text": text,
                "channel": channel,
            }
            self.lines.append(line)
        self.emit({"type": "final", "line": line})
        if self.translate_to:
            lang = self.translate_to
            self.spawn(lambda: self._translate(line, lang))
        for trig in self.detector.final(speaker, is_owner, text, end):
            if trig.prefetch:
                self._prefetch(trig)
            else:
                self._fire(trig)

    # -------------------------------------------------------------------------------- cards

    def _context(self) -> list[str]:
        with self.lock:
            return [f"{ln['speaker']}: {ln['text']}" for ln in self.lines[-8:]]

    def _prefetch(self, trig: Trigger) -> None:
        def run():
            try:
                with new_session(self.scope) as db:
                    f = parse_filters(db, trig.question, owner_name=self.principal.display_name)
                    sources, _ = build_sources(db, self.embedder, trig.question, f, self.settings, k=4)
                self.prefetched = (sources + self.prefetched)[:8]
            except ProviderError:
                pass

        self.spawn(run)

    def _fire(self, trig: Trigger) -> None:
        t0 = time.monotonic()
        if trig.kind == "commitment":
            self.emit({"type": "card", "card": commitment_card(self.ctx, trig)})
            return
        if trig.kind == "explain":
            definition = self.detector.terms.get(trig.term or "")
            if definition:
                self.emit({"type": "card", "card": glossary_card(self.ctx, trig, definition)})
                return
        context = self._context()
        prefetched = list(self.prefetched)

        def run():
            card_key = f"pending-{t0}"
            self.emit(
                {
                    "type": "card_start",
                    "key": card_key,
                    "trigger": trig.kind,
                    "question": trig.question,
                    "speaker": trig.speaker,
                }
            )
            card = draft_card(
                self.ctx,
                trig,
                llm=self.llm,
                embedder=self.embedder,
                settings=self.settings,
                context=context,
                prefetched=prefetched,
                on_delta=lambda d: self.emit({"type": "card_delta", "key": card_key, "text": d}),
                t0=t0,
            )
            self.emit({"type": "card", "key": card_key, "card": card})

        self.spawn(run)

    def ask(self, question: str) -> None:
        """A question typed or tapped by the user (e.g. "explain this term")."""
        at = time.monotonic() - self.started_at
        self._fire(Trigger("manual", question, question, self.principal.display_name, at))

    def explain(self, term: str) -> None:
        at = time.monotonic() - self.started_at
        self._fire(
            Trigger(
                "explain", f"Explain {term}", f"What is {term}?", self.principal.display_name, at, term=term.lower()
            )
        )

    # ----------------------------------------------------------------- summary & translation

    def _maybe_summarize(self, now: float | None = None) -> None:
        now = self.audio_s if now is None else now
        if now - self.last_summary_at < self.settings.live_summary_every_s:
            return
        with self.lock:
            new = self.lines[self.summarized_upto :]
            self.summarized_upto = len(self.lines)
        self.last_summary_at = now
        if not new:
            return
        text = "\n".join(
            f"[{int(ln['start']) // 60}:{int(ln['start']) % 60:02d}] {ln['speaker']}: {ln['text']}" for ln in new
        )

        def run():
            try:
                out = self.llm.complete(ROLLING_SYSTEM, [{"role": "user", "content": text}], max_tokens=400)
                self.emit({"type": "summary", "at": round(now, 1), "text": out.strip()})
            except ProviderError as e:
                log.warning("rolling summary skipped: %s", e)

        self.spawn(run)

    def _translate(self, line: dict, lang: str) -> None:
        try:
            out = self.llm.complete(
                TRANSLATE_SYSTEM.format(lang=lang), [{"role": "user", "content": line["text"]}], max_tokens=400
            )
            self.emit({"type": "translation", "line_id": line["id"], "lang": lang, "text": out.strip()})
        except ProviderError as e:
            log.warning("translation skipped: %s", e)

    def set_translation(self, lang: str | None) -> None:
        self.translate_to = (lang or "").strip() or None
        self.emit({"type": "state", **self.state()})

    # ------------------------------------------------------------------------ off the record

    def _now(self) -> float:
        return self.audio_s if self.has_audio or self._wav is not None else time.monotonic() - self.started_at

    def pause(self) -> None:
        if not self.off_record:
            self.off_record, self.off_since = True, self._now()
            for ch, stream in list(self.streams.items()):  # finish what was said before the pause
                if stream is not None:
                    for r in stream.flush():
                        self._on_text(ch, r)
        self.emit({"type": "state", **self.state()})

    def resume(self) -> None:
        if self.off_record:
            self.off_record = False
            self.gaps.append([round(self.off_since, 2), round(self._now(), 2)])
        self.emit({"type": "state", **self.state()})

    def state(self) -> dict:
        return {
            "off_record": self.off_record,
            "gaps": self.gaps,
            "translate_to": self.translate_to,
            "lines": len(self.lines),
            "audio_s": round(self.audio_s, 1),
        }

    # --------------------------------------------------------------------------------- stop

    def stop(self) -> dict:
        """Hand the meeting to the accurate post-meeting pipeline."""
        if self.stopped:
            return {"status": "stopped"}
        if self.off_record:
            self.resume()
        for ch, stream in list(self.streams.items()):
            if stream is not None:
                for r in stream.flush():
                    self._on_text(ch, r)
                stream.close()
        self.stopped = True
        if self._wav is not None:
            self._wav.close()
        with new_session(self.scope) as db:
            m = db.get(Meeting, self.meeting_id)
            m.off_record = self.gaps
            m.stage = "waiting for worker"
            m.error = None
            if self.has_audio:
                key = f"{m.id}/source.wav"
                self.storage.put_file(self.wav_path, key)
                m.audio_key, m.audio_deleted_at = key, None
                m.channel_layout = "mic_system" if self.channels == 2 else "mono"
                m.status, m.requested_stage = MeetingStatus.QUEUED, "full"
            elif self.lines:  # captions only (bot or platform): the text is the transcript
                raw = [
                    Line(ln["start"], ln["end"], OWNER_LABEL if ln["is_owner"] else ln["speaker"], ln["text"])
                    for ln in self.lines
                ]
                lines, mapping = relabel_with_map(raw)
                save_transcript(db, m, lines, self.settings, platform_names={v: k for k, v in mapping.items()})
                m.duration_s = max(ln.end for ln in lines)
                m.status, m.requested_stage = MeetingStatus.QUEUED, "summarize"
            else:
                m.status, m.stage = MeetingStatus.CREATED, None
            status = m.status
            db.commit()
        self._tmp.cleanup()
        self.emit({"type": "stopped", "status": status, "meeting_id": self.meeting_id})
        return {"status": status}

    def abandon(self) -> None:
        """The capture connection dropped without a stop: keep what we have."""
        if not self.stopped:
            try:
                self.stop()
            except Exception:  # never leave a meeting stuck in "live"
                log.exception("live session %s could not be finalized", self.meeting_id)
