import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError, api } from "../api";
import { useConfig } from "../App";
import { SpeakerEditor } from "../components/SpeakerEditor";
import { SpeakerRibbon } from "../components/SpeakerRibbon";
import { StatusLine, isBusy } from "../components/StatusLine";
import { SummaryView } from "../components/SummaryView";
import { Transcript } from "../components/Transcript";
import { duration, fullDate } from "../lib/format";
import { speakerColors, speakerNames } from "../lib/speakers";
import type { ActionItem, MeetingDetail } from "../types";

export function MeetingDetailPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const linkedTime = params.get("t") ? Number(params.get("t")) : null;
  const navigate = useNavigate();
  const config = useConfig();

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [namesChanged, setNamesChanged] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(linkedTime ?? 0);
  const [playing, setPlaying] = useState(false);

  const load = useCallback(async () => {
    try {
      const m = await api.meeting(id);
      setMeeting(m);
      setError(null);
      return m;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      return null;
    }
  }, [id]);

  // Load, then poll while the worker is busy with this meeting.
  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;
    const tick = async () => {
      const m = await load();
      if (!cancelled && m && isBusy(m.status)) timer = window.setTimeout(tick, 3000);
    };
    tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [load]);

  useEffect(() => {
    if (!meeting?.has_audio || audioSrc) return;
    api
      .audioUrl(meeting.id)
      .then((r) => setAudioSrc(r.url))
      .catch(() => undefined);
  }, [meeting?.has_audio, meeting?.id, audioSrc]);

  // Smooth playhead while playing.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const step = () => {
      if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const seek = useCallback((t: number) => {
    setCurrentTime(t);
    const a = audioRef.current;
    if (a && a.src) {
      a.currentTime = t;
      a.play().catch(() => undefined);
    }
  }, []);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || !a.src) return;
    if (a.paused) {
      if (Math.abs(a.currentTime - currentTime) > 1) a.currentTime = currentTime;
      a.play().catch(() => undefined);
    } else a.pause();
  }, [currentTime]);

  const colors = useMemo(() => speakerColors(meeting?.speakers ?? []), [meeting?.speakers]);
  const names = useMemo(() => speakerNames(meeting?.speakers ?? []), [meeting?.speakers]);

  async function act(fn: () => Promise<unknown>, done?: string) {
    try {
      await fn();
      if (done) setNotice(done);
      await load();
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : String(e));
    }
  }

  async function reprocess(stage: "full" | "summarize") {
    await act(() => api.reprocess(id, stage));
    setNamesChanged(false);
    // restart polling
    const poll = async () => {
      const m = await load();
      if (m && isBusy(m.status)) window.setTimeout(poll, 3000);
    };
    poll();
  }

  async function toggleAction(item: ActionItem) {
    setMeeting((m) =>
      m ? { ...m, action_items: m.action_items.map((a) => (a.id === item.id ? { ...a, done: !a.done } : a)) } : m,
    );
    try {
      await api.setActionItem(item.id, !item.done);
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : String(e));
      load();
    }
  }

  if (error && !meeting) {
    return (
      <div className="page">
        <p className="error" role="alert">
          {error}
        </p>
      </div>
    );
  }
  if (!meeting) return <div className="page muted">Loading…</div>;

  const busy = isBusy(meeting.status);
  const hasTranscript = meeting.segments.length > 0;

  return (
    <div className="page detail">
      <audio
        ref={audioRef}
        src={audioSrc ?? undefined}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => {
          if (linkedTime != null) e.currentTarget.currentTime = linkedTime;
        }}
      />

      <div className="detail-head">
        <div>
          {editingTitle ? (
            <input
              className="title-input"
              defaultValue={meeting.title}
              autoFocus
              aria-label="Meeting title"
              onBlur={(e) => {
                setEditingTitle(false);
                const v = e.target.value.trim();
                if (v && v !== meeting.title) act(() => api.updateMeeting(id, { title: v }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditingTitle(false);
              }}
            />
          ) : (
            <h1>
              <button className="title-button" onClick={() => setEditingTitle(true)} title="Rename">
                {meeting.title}
              </button>
            </h1>
          )}
          <p className="muted">
            {fullDate(meeting.started_at)}
            {meeting.duration_s ? `, ${duration(meeting.duration_s)}` : ""}
            {meeting.audio_deleted_at ? ". Audio removed after the retention period; the text is kept." : ""}
          </p>
        </div>
        <div className="head-actions">
          <select
            aria-label="Meeting type"
            value={meeting.profile}
            disabled={busy}
            onChange={(e) =>
              act(() => api.updateMeeting(id, { profile: e.target.value }), "Meeting type changed. Regenerate the summary to apply it.")
            }
          >
            {(config?.profiles ?? []).map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <details className="menu">
            <summary className="button">More</summary>
            <div className="menu-items">
              <button disabled={busy || !hasTranscript} onClick={() => reprocess("summarize")}>
                Regenerate summary
              </button>
              <button
                disabled={busy || !meeting.has_audio}
                onClick={() => {
                  if (confirm("Transcribe this meeting again from the audio? Speaker names you've set will be reset."))
                    reprocess("full");
                }}
              >
                Transcribe again from audio
              </button>
              <button
                className="danger"
                disabled={busy}
                onClick={() => {
                  if (confirm(`Delete “${meeting.title}”, its audio, transcript and summary? This can't be undone.`))
                    api
                      .deleteMeeting(id)
                      .then(() => navigate("/"))
                      .catch((e) => setNotice(e instanceof ApiError ? e.message : String(e)));
                }}
              >
                Delete meeting
              </button>
            </div>
          </details>
        </div>
      </div>

      {busy && (
        <div className="banner">
          <StatusLine status={meeting.status} stage={meeting.stage} />
          <span className="muted">This page updates on its own.</span>
        </div>
      )}
      {meeting.status === "failed" && (
        <div className="banner error-banner" role="alert">
          <span>Processing failed: {meeting.error}</span>
          <button className="button" onClick={() => reprocess(meeting.has_audio ? "full" : "summarize")}>
            Try again
          </button>
        </div>
      )}
      {meeting.status === "created" && (
        <div className="banner">This meeting has no audio yet. Upload a recording from the Meetings page.</div>
      )}
      {notice && (
        <div className="banner" role="status">
          <span>{notice}</span>
          <button className="link" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </div>
      )}
      {namesChanged && !busy && (
        <div className="banner">
          <span>Names updated. Regenerate the summary so it uses them.</span>
          <button className="button primary" onClick={() => reprocess("summarize")}>
            Regenerate summary
          </button>
        </div>
      )}

      {hasTranscript && (
        <SpeakerRibbon
          speakers={meeting.speakers}
          segments={meeting.segments}
          colors={colors}
          duration={meeting.duration_s ?? 0}
          currentTime={currentTime}
          playing={playing}
          hasAudio={!!audioSrc}
          onSeek={seek}
          onTogglePlay={togglePlay}
        />
      )}

      <div className="detail-body">
        <div className="col-summary">
          <h2>Summary</h2>
          {meeting.summary ? (
            <SummaryView
              summary={meeting.summary}
              actionItems={meeting.action_items}
              speakers={meeting.speakers}
              colors={colors}
              onSeek={seek}
              onToggleAction={toggleAction}
            />
          ) : (
            <p className="muted">{busy ? "The summary appears when processing finishes." : "No summary yet."}</p>
          )}
        </div>

        <div className="col-transcript">
          <h2>Transcript</h2>
          {meeting.speakers.length > 0 && (
            <SpeakerEditor
              speakers={meeting.speakers}
              colors={colors}
              disabled={busy}
              onRename={async (label, name) => {
                await act(() => api.renameSpeaker(id, label, name));
                setNamesChanged(true);
              }}
              onMerge={async (from, into) => {
                await act(() => api.mergeSpeakers(id, from, into));
                setNamesChanged(true);
              }}
            />
          )}
          {hasTranscript ? (
            <Transcript
              segments={meeting.segments}
              names={names}
              colors={colors}
              currentTime={currentTime}
              playing={playing}
              onSeek={seek}
              highlight={linkedTime}
            />
          ) : (
            !busy && <p className="muted">No transcript yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
