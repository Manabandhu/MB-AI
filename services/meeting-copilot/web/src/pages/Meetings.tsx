import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, api } from "../api";
import { useConfig } from "../App";
import { StatusLine, isBusy } from "../components/StatusLine";
import { dayLabel, duration, timeOfDay } from "../lib/format";
import type { MeetingListItem } from "../types";

export function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const load = async () => {
      try {
        const list = await api.meetings(query.trim() || undefined);
        if (cancelled) return;
        setMeetings(list);
        setError(null);
        if (list.some((m) => isBusy(m.status))) timer = window.setTimeout(load, 4000);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : String(e));
      }
    };
    const debounce = window.setTimeout(load, query ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(debounce);
      window.clearTimeout(timer);
    };
  }, [query]);

  const groups = useMemo(() => {
    const out: { day: string; items: MeetingListItem[] }[] = [];
    for (const m of meetings ?? []) {
      const day = dayLabel(m.started_at);
      if (out.at(-1)?.day !== day) out.push({ day, items: [] });
      out.at(-1)!.items.push(m);
    }
    return out;
  }, [meetings]);

  return (
    <div className="page meetings-page">
      <div className="page-head">
        <h1>Meetings</h1>
        <div className="head-actions">
          <input
            type="search"
            placeholder="Filter by title"
            aria-label="Filter meetings by title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="button" onClick={() => setUploading(true)}>
            Upload a recording
          </button>
        </div>
      </div>

      {uploading && <UploadDialog onClose={() => setUploading(false)} />}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {meetings === null && !error && <p className="muted">Loading meetings…</p>}
      {meetings?.length === 0 && (
        <div className="empty">
          {query ? (
            <p>No meeting titles match “{query}”. To search what was said, use Ask.</p>
          ) : (
            <>
              <p>No meetings yet. Record your next standup, or upload a recording you already have.</p>
              <Link to="/record" className="button primary">
                Record a meeting
              </Link>
            </>
          )}
        </div>
      )}

      {groups.map((g) => (
        <section key={g.day} className="day">
          <h2>{g.day}</h2>
          <ul className="meeting-list">
            {g.items.map((m) => (
              <li key={m.id}>
                <Link to={`/meetings/${m.id}`} className="meeting-row">
                  <span className="when">{timeOfDay(m.started_at)}</span>
                  <span className="what">
                    <span className="title">{m.title}</span>
                    {m.overview ? <span className="overview">{m.overview}</span> : <StatusLine status={m.status} stage={m.stage} />}
                  </span>
                  <span className="meta">
                    <span>{duration(m.duration_s)}</span>
                    {m.open_action_items > 0 && (
                      <span>
                        {m.open_action_items} open {m.open_action_items === 1 ? "item" : "items"}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function UploadDialog({ onClose }: { onClose: () => void }) {
  const config = useConfig();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [profile, setProfile] = useState("standup");
  const [stereo, setStereo] = useState(false);
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const meeting = await api.createMeeting({
        title: title.trim() || file.name.replace(/\.[^.]+$/, ""),
        profile,
        started_at: new Date(file.lastModified || Date.now()).toISOString(),
        channel_layout: stereo ? "mic_system" : "mono",
        consent_confirmed: consent,
      });
      await api.uploadAudio(meeting.id, file, file.name, setProgress);
      navigate(`/meetings/${meeting.id}`);
    } catch (err) {
      setProgress(null);
      setError(err instanceof ApiError ? err.message : String(err));
    }
  }

  return (
    <dialog ref={dialogRef} onClose={onClose} className="dialog">
      <form onSubmit={submit}>
        <h2>Upload a recording</h2>
        <label htmlFor="up-file">Audio or video file</label>
        <input
          id="up-file"
          type="file"
          accept="audio/*,video/*,.flac,.m4a,.webm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
        />
        <label htmlFor="up-title">Title</label>
        <input id="up-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Defaults to the file name" />
        <label htmlFor="up-profile">Meeting type</label>
        <select id="up-profile" value={profile} onChange={(e) => setProfile(e.target.value)}>
          {(config?.profiles ?? [{ key: "standup", label: "Standup" }]).map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={stereo} onChange={(e) => setStereo(e.target.checked)} />
          Stereo file with my mic on the left and the meeting on the right
        </label>
        <label className="check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
          Everyone in this recording knew it was being recorded
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {progress !== null && <progress value={progress} max={1} aria-label="Upload progress" />}
        <div className="dialog-actions">
          <button type="button" className="button" onClick={() => dialogRef.current?.close()}>
            Cancel
          </button>
          <button className="button primary" disabled={!file || !consent || progress !== null}>
            {progress !== null ? `Uploading ${Math.round(progress * 100)}%` : "Upload and process"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
