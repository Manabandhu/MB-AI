import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError, api, saveText } from "../api";
import { useConfig } from "../App";
import { AnswerCard } from "../components/AnswerCard";
import { BriefPanel } from "../components/BriefPanel";
import { SpeakerEditor } from "../components/SpeakerEditor";
import { SpeakerRibbon } from "../components/SpeakerRibbon";
import { StatusLine, isBusy } from "../components/StatusLine";
import { SummaryView } from "../components/SummaryView";
import { Transcript } from "../components/Transcript";
import { clock, duration, fullDate } from "../lib/format";
import { speakerColors, speakerNames } from "../lib/speakers";
import type { ActionItem, Brief, Digest, JiraDraft, LiveCard, MeetingDetail, Person } from "../types";

export function MeetingDetailPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const linkedTime = params.get("t") ? Number(params.get("t")) : null;
  const navigate = useNavigate();
  const config = useConfig();

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [namesChanged, setNamesChanged] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [cards, setCards] = useState<LiveCard[]>([]);
  const [botUrl, setBotUrl] = useState("");
  const [jira, setJira] = useState<{ item: ActionItem; draft: JiraDraft } | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const vttRef = useRef<HTMLInputElement>(null);
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

  // Load, then poll while the worker (or a live session) is busy with this meeting.
  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;
    const tick = async () => {
      const m = await load();
      if (!cancelled && m && isBusy(m.status)) timer = window.setTimeout(tick, 3000);
    };
    tick();
    api.people().then(setPeople).catch(() => undefined);
    api.liveCards(id).then(setCards).catch(() => undefined);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [load, id]);

  useEffect(() => {
    if (meeting?.status === "created" && !brief) api.brief(id).then(setBrief).catch(() => undefined);
  }, [meeting?.status, id, brief]);

  useEffect(() => {
    if (!meeting?.has_audio || audioSrc) return;
    api
      .audioUrl(meeting.id)
      .then((r) => setAudioSrc(r.url))
      .catch(() => undefined);
  }, [meeting?.has_audio, meeting?.id, audioSrc]);

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
    const poll = async () => {
      const m = await load();
      if (m && isBusy(m.status)) window.setTimeout(poll, 3000);
    };
    poll();
  }

  async function toggleAction(item: ActionItem) {
    setMeeting((m) => (m ? { ...m, action_items: m.action_items.map((a) => (a.id === item.id ? { ...a, done: !a.done } : a)) } : m));
    try {
      await api.setActionItem(item.id, !item.done);
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : String(e));
      load();
    }
  }

  async function openJira(item: ActionItem) {
    try {
      const r = await api.jiraDraft(item.id);
      if (r.key) setNotice(`Already filed as ${r.key}.`);
      else if (r.draft) setJira({ item, draft: r.draft });
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : String(e));
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
  const profileLabel = config?.profiles.find((p) => p.key === meeting.profile)?.label ?? meeting.profile;

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
            {meeting.profile_source === "auto" && ` · detected as ${profileLabel}`}
            {meeting.local_only && " · sensitive (no third-party APIs)"}
            {meeting.audio_deleted_at ? ". Audio removed after the retention period; the text is kept." : ""}
          </p>
        </div>
        <div className="head-actions">
          <select
            aria-label="Meeting type"
            value={meeting.profile}
            disabled={busy}
            onChange={(e) => act(() => api.updateMeeting(id, { profile: e.target.value }), "Meeting type changed. Regenerate the summary to apply it.")}
          >
            {(config?.profiles ?? []).map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          {hasTranscript && (
            <button className={`button${digest ? " primary" : ""}`} onClick={() => (digest ? setDigest(null) : api.digest(id).then(setDigest))}>
              {digest ? "Show everything" : "Only what concerns me"}
            </button>
          )}
          <details className="menu">
            <summary className="button">More</summary>
            <div className="menu-items">
              <button disabled={!hasTranscript} onClick={() => api.exportMeeting(id).then((md) => saveText(`${meeting.title}.md`, md))}>
                Export as Markdown
              </button>
              <button disabled={!meeting.summary} onClick={() => act(() => api.postSummary(id), "Posted the summary.")}>
                Post summary to Slack / Teams
              </button>
              <button onClick={() => !brief && api.brief(id).then(setBrief)}>Show brief</button>
              <button disabled={busy} onClick={() => vttRef.current?.click()}>
                Use a Teams/Zoom transcript for names…
              </button>
              <button onClick={() => act(() => api.updateMeeting(id, { local_only: !meeting.local_only }))}>
                {meeting.local_only ? "Allow third-party APIs" : "Mark sensitive (local only)"}
              </button>
              <button disabled={busy || !hasTranscript} onClick={() => reprocess("summarize")}>
                Regenerate summary
              </button>
              <button
                disabled={busy || !meeting.has_audio}
                onClick={() => confirm("Transcribe this meeting again from the audio? Speaker names you've set will be reset.") && reprocess("full")}
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
          <input
            ref={vttRef}
            type="file"
            accept=".vtt,text/vtt"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) act(() => api.uploadPlatformTranscript(id, f), "Speaker names loaded. Transcribe again from audio to apply them.");
            }}
          />
        </div>
      </div>

      {meeting.consent_state !== "confirmed" && (
        <div className="banner">
          <span>Consent isn't confirmed yet. Everyone in a meeting must know it's being recorded before any audio is accepted.</span>
          <button className="button" onClick={() => act(() => api.confirmConsent(id, "verbal"))}>
            Everyone was told
          </button>
        </div>
      )}
      {meeting.status === "live" && (
        <div className="banner">
          <StatusLine status={meeting.status} stage={meeting.stage} />
          <Link className="button" to={`/live/${id}`}>
            Watch live
          </Link>
        </div>
      )}
      {busy && meeting.status !== "live" && (
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
        <div className="banner start-options">
          <span>No recording yet.</span>
          <Link className="button" to={`/live/${id}?capture=meeting`}>
            Start live assist
          </Link>
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              act(() => api.sendBot(id, botUrl.trim(), meeting.consent_state === "confirmed"), "The bot is joining.");
            }}
          >
            <input aria-label="Meeting link for the bot" placeholder="Meeting link for the bot" value={botUrl || meeting.meeting_url || ""} onChange={(e) => setBotUrl(e.target.value)} />
            <button className="button" disabled={!(botUrl || meeting.meeting_url) || meeting.consent_state !== "confirmed"}>
              Send bot
            </button>
          </form>
          <span className="muted">or upload a recording from the Meetings page.</span>
        </div>
      )}
      {meeting.bot_id && (
        <div className="banner">
          <span>
            Meeting bot: {meeting.bot_status ?? "unknown"}
            {meeting.platform_labels && " · speaker names come from the platform"}
          </span>
          <button className="button" onClick={() => act(() => api.syncBot(id))}>
            Check status
          </button>
          {!["ended", "leaving", "post_processing_completed"].includes(meeting.bot_status ?? "") && (
            <button className="button" onClick={() => act(() => api.removeBot(id))}>
              Remove bot
            </button>
          )}
        </div>
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
      {jira && (
        <div className="banner jira-box" role="dialog" aria-label="Jira ticket">
          <label className="grow">
            Ticket summary
            <input value={jira.draft.summary} onChange={(e) => setJira({ ...jira, draft: { ...jira.draft, summary: e.target.value } })} />
          </label>
          <span className="muted small">
            {jira.draft.project || "No project set"} · {jira.draft.issue_type}
            {jira.draft.due_date && ` · due ${jira.draft.due_date}`}
          </span>
          <button
            className="button primary"
            onClick={async () => {
              try {
                await api.saveJiraDraft(jira.item.id, { summary: jira.draft.summary });
                const r = await api.fileJira(jira.item.id);
                setJira(null);
                setNotice(`Filed ${r.key}.`);
              } catch (e) {
                setNotice(e instanceof ApiError ? e.message : String(e));
              }
            }}
          >
            File in Jira
          </button>
          <button className="link" onClick={() => setJira(null)}>
            Cancel
          </button>
        </div>
      )}

      {brief && meeting.status === "created" && <BriefPanel brief={brief} />}

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

      {digest ? (
        <DigestView digest={digest} onSeek={seek} />
      ) : (
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
                onEditOverview={(text) => act(() => api.editSummary(id, { overview: text }))}
                renderActionExtra={(a) => (
                  <button className="link small" onClick={() => openJira(a)} title="Draft a Jira ticket">
                    Jira
                  </button>
                )}
              />
            ) : (
              <p className="muted">{busy ? "The summary appears when processing finishes." : "No summary yet."}</p>
            )}
            {brief && meeting.status !== "created" && <BriefPanel brief={brief} />}
            {cards.length > 0 && (
              <section>
                <h3>Answer cards from the meeting</h3>
                {cards.map((c) => (
                  <AnswerCard key={c.id} card={c} onFeedback={(v) => c.id != null && api.cardFeedback(c.id, v)} />
                ))}
              </section>
            )}
          </div>

          <div className="col-transcript">
            <h2>Transcript</h2>
            {meeting.speakers.length > 0 && (
              <SpeakerEditor
                speakers={meeting.speakers}
                people={people}
                colors={colors}
                disabled={busy}
                canEnroll={!!meeting.has_audio}
                onRename={async (label, name) => {
                  await act(() => api.renameSpeaker(id, label, { display_name: name }));
                  setNamesChanged(true);
                  api.people().then(setPeople);
                }}
                onLink={async (label, personId) => {
                  await act(() => api.renameSpeaker(id, label, { person_id: personId }));
                  setNamesChanged(true);
                }}
                onMerge={async (from, into) => {
                  await act(() => api.mergeSpeakers(id, from, into));
                  setNamesChanged(true);
                }}
                onEnroll={async (label, personId) => {
                  await act(() => api.enrollFromMeeting(id, label, personId), "Voiceprint saved. They'll be recognized in future meetings.");
                  api.people().then(setPeople);
                }}
              />
            )}
            {hasTranscript ? (
              <Transcript
                segments={meeting.segments}
                speakers={meeting.speakers}
                names={names}
                colors={colors}
                currentTime={currentTime}
                playing={playing}
                onSeek={seek}
                onFix={busy ? undefined : (segId, label) => act(() => api.fixLine(id, segId, label))}
                gaps={meeting.off_record}
                highlight={linkedTime}
              />
            ) : (
              !busy && <p className="muted">No transcript yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DigestView({ digest, onSeek }: { digest: Digest; onSeek: (t: number) => void }) {
  if (digest.nothing_for_you)
    return <p className="empty">Nothing in this meeting mentions you, your commitments or your watched topics.</p>;
  return (
    <section className="digest">
      {digest.overview && <p className="overview">{digest.overview}</p>}
      {digest.your_update && (
        <>
          <h3>Your update</h3>
          <p>
            {[...digest.your_update.yesterday, ...digest.your_update.today].join("; ")}
            {digest.your_update.blockers.length > 0 && ` · blocked: ${digest.your_update.blockers.join("; ")}`}
          </p>
        </>
      )}
      {digest.your_action_items.length > 0 && (
        <>
          <h3>Asked of you</h3>
          <ul>
            {digest.your_action_items.map((a) => (
              <li key={a.id}>
                {a.text}
                {a.due && <span className="muted"> (due {a.due})</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      {digest.decisions_about_your_work.length > 0 && (
        <>
          <h3>Decisions about your work</h3>
          <ul>
            {digest.decisions_about_your_work.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </>
      )}
      {digest.mentions.length > 0 && (
        <>
          <h3>Where you came up</h3>
          <ol className="transcript">
            {digest.mentions.map((m) => (
              <li key={m.segment_id} className="line">
                <button className="stamp" onClick={() => onSeek(m.start)}>
                  {clock(m.start)}
                </button>
                <div>
                  <span className="who">{m.speaker}</span>
                  <p>{m.text}</p>
                  <p className="muted small">{m.why.join(", ")}</p>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
