import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, api } from "../api";
import { useConfig } from "../App";
import { clock } from "../lib/format";
import { MeetingRecorder, RecorderError, type Levels, type RecorderMode } from "../lib/recorder";

type Phase = "setup" | "recording" | "uploading" | "upload-failed";

function defaultTitle(profile: string) {
  const day = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date());
  return `${profile === "standup" ? "Standup" : "Meeting"}, ${day}`;
}

export function RecordPage() {
  const config = useConfig();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<RecorderMode>("meeting");
  const [profile, setProfile] = useState("standup");
  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [levels, setLevels] = useState<Levels>({ mic: 0, meeting: 0 });
  const [progress, setProgress] = useState(0);
  const recorderRef = useRef<MeetingRecorder | null>(null);
  const startedAtRef = useRef<Date>(new Date());
  const pendingRef = useRef<Blob | null>(null);
  const meetingIdRef = useRef<string | null>(null);

  // Meters and timer while recording.
  useEffect(() => {
    if (phase !== "recording") return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const r = recorderRef.current;
      if (r) {
        setLevels(r.levels());
        const dt = (now - last) / 1000; // read now: React may run the updater after `last` changes
        if (r.state === "recording") setElapsed((e) => e + dt);
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Warn before closing the tab while there is audio that hasn't reached the server.
  useEffect(() => {
    if (phase === "setup") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  useEffect(() => () => recorderRef.current?.cleanup(), []);

  async function start(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const r = new MeetingRecorder(mode);
    r.onEnded = () => stop();
    try {
      await r.start();
    } catch (err) {
      setError(err instanceof RecorderError ? err.message : String(err));
      return;
    }
    recorderRef.current = r;
    startedAtRef.current = new Date();
    setElapsed(0);
    setPhase("recording");
  }

  async function stop() {
    const r = recorderRef.current;
    if (!r || r.state === "idle") return;
    recorderRef.current = null;
    setPhase("uploading");
    try {
      pendingRef.current = await r.stop();
    } catch (err) {
      setError(err instanceof RecorderError ? err.message : String(err));
      setPhase("setup");
      return;
    }
    await upload();
  }

  /** Create the meeting (once) and upload. On failure the recording stays in memory for a retry. */
  async function upload() {
    const blob = pendingRef.current;
    if (!blob) return;
    setPhase("uploading");
    setError(null);
    setProgress(0);
    try {
      if (!meetingIdRef.current) {
        const meeting = await api.createMeeting({
          title: title.trim() || defaultTitle(profile),
          profile,
          started_at: startedAtRef.current.toISOString(),
          attendees: attendees
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          channel_layout: mode === "meeting" ? "mic_system" : "mono",
          consent_confirmed: consent,
        });
        meetingIdRef.current = meeting.id;
      }
      const ext = blob.type.includes("ogg") ? "ogg" : "webm";
      await api.uploadAudio(meetingIdRef.current, blob, `recording.${ext}`, setProgress);
      pendingRef.current = null;
      navigate(`/meetings/${meetingIdRef.current}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
      setPhase("upload-failed");
    }
  }

  function download() {
    const blob = pendingRef.current;
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `recording-${startedAtRef.current.toISOString().slice(0, 16).replace(":", "")}.webm`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  }

  function togglePause() {
    const r = recorderRef.current;
    if (!r) return;
    if (paused) r.resume();
    else r.pause();
    setPaused(!paused);
  }

  if (phase === "upload-failed") {
    return (
      <div className="page record live">
        <p className="rec-state">Not uploaded yet</p>
        <p className="error" role="alert">
          {error}
        </p>
        <p className="muted">The recording is still in this tab. Keep it open and try again, or save a copy.</p>
        <div className="rec-actions">
          <button className="button" onClick={download}>
            Save a copy
          </button>
          <button className="button primary" onClick={upload}>
            Try the upload again
          </button>
        </div>
      </div>
    );
  }

  if (phase === "recording" || phase === "uploading") {
    return (
      <div className="page record live">
        <p className="rec-state">
          <span className={`rec-dot${paused ? " paused" : ""}`} aria-hidden="true" />
          {phase === "uploading" ? "Saving" : paused ? "Paused" : "Recording"}
        </p>
        <p className="rec-clock" aria-live="off">
          {clock(elapsed)}
        </p>
        <div className="meters">
          <Meter label="You" value={levels.mic} color="var(--voice-owner)" />
          {mode === "meeting" && <Meter label="Meeting audio" value={levels.meeting} color="var(--voice-1)" />}
        </div>
        {phase === "recording" ? (
          <div className="rec-actions">
            <button className="button" onClick={togglePause}>
              {paused ? "Resume" : "Pause"}
            </button>
            <button className="button primary" onClick={stop}>
              Stop and process
            </button>
          </div>
        ) : (
          <div className="rec-actions">
            <progress value={progress} max={1} aria-label="Upload progress" />
            <span className="muted">Uploading {Math.round(progress * 100)}%</span>
          </div>
        )}
        <p className="muted small">If the meeting meter stays flat while others talk, stop and share again with system audio on.</p>
      </div>
    );
  }

  return (
    <div className="page record">
      <h1>Record a meeting</h1>
      <form onSubmit={start} className="record-form">
        <fieldset>
          <legend>What are you recording?</legend>
          <label className="choice">
            <input type="radio" name="mode" checked={mode === "meeting"} onChange={() => setMode("meeting")} />
            <span>
              <strong>A call on this computer</strong>
              <span className="muted">
                Teams, Zoom or Meet. Your browser asks what to share: pick <em>Entire screen</em> and turn on{" "}
                <em>Share system audio</em>. For a meeting in a browser tab, share that tab with <em>Share tab audio</em>.
              </span>
            </span>
          </label>
          <label className="choice">
            <input type="radio" name="mode" checked={mode === "in-person"} onChange={() => setMode("in-person")} />
            <span>
              <strong>People in the room</strong>
              <span className="muted">Uses only your microphone. Speakers are separated by voice afterwards.</span>
            </span>
          </label>
        </fieldset>

        <div className="row">
          <div>
            <label htmlFor="rec-profile">Meeting type</label>
            <select id="rec-profile" value={profile} onChange={(e) => setProfile(e.target.value)}>
              {(config?.profiles ?? [{ key: "standup", label: "Standup" }]).map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grow">
            <label htmlFor="rec-title">Title</label>
            <input id="rec-title" value={title} placeholder={defaultTitle(profile)} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>

        <label htmlFor="rec-attendees">Who's attending (optional)</label>
        <input
          id="rec-attendees"
          value={attendees}
          placeholder="Names, separated by commas"
          onChange={(e) => setAttendees(e.target.value)}
        />

        <label className="check consent">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
          I've told everyone in this meeting that I'm recording it
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!MeetingRecorder.supported() && (
          <p className="error">This browser can't record audio. Use Chrome or Edge, or the Windows desktop recorder.</p>
        )}

        <button className="button primary big" disabled={!consent || !MeetingRecorder.supported()}>
          <span className="rec-dot" aria-hidden="true" />
          Start recording
        </button>
      </form>
    </div>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="meter">
      <span>{label}</span>
      <div className="meter-track" role="meter" aria-label={`${label} level`} aria-valuemin={0} aria-valuemax={1} aria-valuenow={value}>
        <div className="meter-fill" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
      </div>
    </div>
  );
}
