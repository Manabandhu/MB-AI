import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError, api, liveSocketUrl } from "../api";
import { useConfig } from "../App";
import { AnswerCard } from "../components/AnswerCard";
import { BriefPanel } from "../components/BriefPanel";
import { clock } from "../lib/format";
import { CaptureError, LiveCapture, type CaptureMode } from "../lib/livecapture";
import type { Brief, BriefCommitment, LiveCard, LiveLine } from "../types";

type Mode = CaptureMode | "bot";

function splitList(s: string) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Set up a live meeting: capture in the browser, or send a bot to the call. */
export function LiveSetupPage() {
  const config = useConfig();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("meeting");
  const [title, setTitle] = useState("");
  const [profile, setProfile] = useState("auto");
  const [attendees, setAttendees] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [localOnly, setLocalOnly] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const m = await api.createMeeting({
        title: title.trim() || `Meeting, ${new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`,
        profile,
        attendees: splitList(attendees),
        channel_layout: mode === "meeting" ? "mic_system" : "mono",
        consent_confirmed: consent,
        consent_method: mode === "bot" ? "bot_notice" : mode === "room" ? "verbal" : "tap",
        source: mode === "bot" ? "bot" : "live",
        local_only: localOnly,
        meeting_url: mode === "bot" ? meetingUrl.trim() : undefined,
      });
      if (mode === "bot") {
        await api.sendBot(m.id, meetingUrl.trim(), consent);
        navigate(`/live/${m.id}?view=1`);
      } else {
        navigate(`/live/${m.id}?capture=${mode}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
      setBusy(false);
    }
  }

  const profiles = [{ key: "auto", label: "Detect automatically" }, ...(config?.profiles ?? [])];
  return (
    <div className="page record">
      <h1>Live assist</h1>
      <p className="muted lede">
        A live transcript, a rolling summary, and an answer card within seconds when someone asks you something. Answers come
        only from your own meeting history, always with a source.
      </p>
      <form onSubmit={start} className="record-form">
        <fieldset>
          <legend>Where is the meeting?</legend>
          <label className="choice">
            <input type="radio" name="mode" checked={mode === "meeting"} onChange={() => setMode("meeting")} />
            <span>
              <strong>A call on this computer</strong>
              <span className="muted">Share your screen or the meeting tab with audio. You and the others stay on separate channels.</span>
            </span>
          </label>
          <label className="choice">
            <input type="radio" name="mode" checked={mode === "room"} onChange={() => setMode("room")} />
            <span>
              <strong>People in the room</strong>
              <span className="muted">Your microphone only. Never always-on: you start and stop it.</span>
            </span>
          </label>
          <label className="choice">
            <input type="radio" name="mode" checked={mode === "bot"} onChange={() => setMode("bot")} />
            <span>
              <strong>Send a bot to the call</strong>
              <span className="muted">
                A visible participant named “Meeting Copilot (recording)” joins Teams, Zoom or Meet. Names come from the platform.
              </span>
            </span>
          </label>
        </fieldset>
        {mode === "bot" && (
          <>
            <label htmlFor="live-url">Meeting link</label>
            <input id="live-url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://teams.microsoft.com/…" required />
          </>
        )}
        <div className="row">
          <div>
            <label htmlFor="live-profile">Meeting type</label>
            <select id="live-profile" value={profile} onChange={(e) => setProfile(e.target.value)}>
              {profiles.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grow">
            <label htmlFor="live-title">Title</label>
            <input id="live-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Defaults to today's date" />
          </div>
        </div>
        <label htmlFor="live-attendees">Who's attending</label>
        <input
          id="live-attendees"
          value={attendees}
          onChange={(e) => setAttendees(e.target.value)}
          placeholder="Names or emails, separated by commas. Used for the brief and voice matching."
        />
        <label className="check">
          <input type="checkbox" checked={localOnly} onChange={(e) => setLocalOnly(e.target.checked)} />
          Sensitive: refuse any third-party API for this meeting
        </label>
        <label className="check consent">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
          Everyone in this meeting knows it is being recorded
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {mode !== "bot" && !LiveCapture.supported() && <p className="error">This browser can't capture audio. Use Chrome or Edge.</p>}
        <button className="button primary big" disabled={!consent || busy || (mode !== "bot" && !LiveCapture.supported())}>
          <span className="rec-dot" aria-hidden="true" />
          {mode === "bot" ? "Send the bot" : "Start live assist"}
        </button>
      </form>
    </div>
  );
}

interface PendingCard {
  key: string;
  question: string;
  speaker?: string;
  text: string;
}

interface AgendaItem {
  title: string;
  minutes: number;
  spent: number;
}

/** A meeting in progress: capture (this tab streams audio) or view (a second screen, or a bot is in the call). */
export function LiveSessionPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const captureMode = (params.get("capture") as CaptureMode | null) ?? null;
  const navigate = useNavigate();

  const [status, setStatus] = useState<"connecting" | "live" | "stopping" | "stopped" | "error">("connecting");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lines, setLines] = useState<LiveLine[]>([]);
  const [partials, setPartials] = useState<Record<string, string>>({});
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [cards, setCards] = useState<LiveCard[]>([]);
  const [pending, setPending] = useState<Record<string, PendingCard>>({});
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [summaries, setSummaries] = useState<{ at: number; text: string }[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [nudges, setNudges] = useState<BriefCommitment[]>([]);
  const [offRecord, setOffRecord] = useState(false);
  const [gaps, setGaps] = useState<number[][]>([]);
  const [translateTo, setTranslateTo] = useState("");
  const [earbud, setEarbud] = useState(false);
  const [question, setQuestion] = useState("");
  const [levels, setLevels] = useState({ mic: 0, meeting: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [agendaIndex, setAgendaIndex] = useState(0);
  const [parking, setParking] = useState<string[]>([]);
  const [meetingTitle, setMeetingTitle] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const captureRef = useRef<LiveCapture | null>(null);
  const transcriptEnd = useRef<HTMLDivElement>(null);
  const earbudRef = useRef(earbud);
  earbudRef.current = earbud;

  const speak = useCallback((text: string) => {
    if (!earbudRef.current || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.1;
    window.speechSynthesis.speak(u);
  }, []);

  const send = useCallback((msg: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  useEffect(() => {
    api.meeting(id).then((m) => setMeetingTitle(m.title)).catch(() => undefined);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const role = captureMode ? "capture" : "view";
    const capture = captureMode ? new LiveCapture(captureMode, (buf) => wsRef.current?.readyState === 1 && wsRef.current.send(buf)) : null;
    const ws = new WebSocket(liveSocketUrl(id, role, capture?.channels ?? 1));
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = async () => {
      if (!capture) {
        setStatus("live");
        return;
      }
      try {
        await capture.start();
        if (cancelled) return capture.stop();
        captureRef.current = capture;
        capture.onEnded = () => send({ type: "stop" });
        setStatus("live");
      } catch (e) {
        setError(e instanceof CaptureError ? e.message : String(e));
        setStatus("error");
        ws.close();
      }
    };
    ws.onmessage = (msg) => {
      const e = JSON.parse(msg.data);
      switch (e.type) {
        case "notice":
          setNotice(e.text);
          break;
        case "brief":
          setBrief(e.brief);
          break;
        case "nudges":
          setNudges(e.items);
          break;
        case "partial":
          setPartials((p) => ({ ...p, [e.speaker]: e.text }));
          break;
        case "final":
          setLines((ls) => (ls.some((l) => l.id === e.line.id) ? ls : [...ls, e.line]));
          setPartials((p) => {
            const { [e.line.speaker]: _drop, ...rest } = p;
            return rest;
          });
          break;
        case "translation":
          setTranslations((t) => ({ ...t, [e.line_id]: e.text }));
          break;
        case "card_start":
          setPending((p) => ({ ...p, [e.key]: { key: e.key, question: e.question, speaker: e.speaker, text: "" } }));
          break;
        case "card_delta":
          setPending((p) => (p[e.key] ? { ...p, [e.key]: { ...p[e.key], text: p[e.key].text + e.text } } : p));
          break;
        case "card":
          setCards((cs) => [e.card, ...cs.filter((c) => c.id !== e.card.id)]);
          if (e.key)
            setPending((p) => {
              const { [e.key]: _done, ...rest } = p;
              return rest;
            });
          if (e.card.kind !== "update") speak(e.card.answer);
          break;
        case "summary":
          setSummaries((s) => [...s, { at: e.at, text: e.text }]);
          break;
        case "state":
          setOffRecord(e.off_record);
          setGaps(e.gaps ?? []);
          setTranslateTo(e.translate_to ?? "");
          break;
        case "error":
          setError(e.text);
          break;
        case "stopped":
          setStatus("stopped");
          captureRef.current?.stop();
          if (captureMode) navigate(`/meetings/${id}`);
          break;
      }
    };
    ws.onclose = (ev) => {
      captureRef.current?.stop();
      if (ev.code >= 4400) {
        setError(ev.reason || "The live session was refused.");
        setStatus("error");
      } else setStatus((s) => (s === "stopped" || s === "error" ? s : "stopped"));
    };
    return () => {
      cancelled = true;
      capture?.stop();
      ws.close();
    };
  }, [id, captureMode, navigate, send, speak]);

  // Meters, the clock and the agenda timer.
  useEffect(() => {
    if (status !== "live") return;
    const started = performance.now() - elapsed * 1000;
    const timer = window.setInterval(() => {
      const now = (performance.now() - started) / 1000;
      setElapsed(now);
      if (captureRef.current) setLevels(captureRef.current.levels());
      setAgenda((a) => a.map((item, i) => (i === agendaIndex ? { ...item, spent: item.spent + 0.25 } : item)));
    }, 250);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, agendaIndex]);

  useEffect(() => transcriptEnd.current?.scrollIntoView({ block: "end" }), [lines.length]);

  function toggleRecord() {
    if (captureRef.current) captureRef.current.paused = !offRecord;
    send({ type: offRecord ? "resume" : "pause" });
  }

  function stop() {
    setStatus("stopping");
    if (captureMode) send({ type: "stop" });
    else api.stopLive(id).catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
  }

  function ask(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    if (/^(explain|define)\s+/i.test(q)) send({ type: "explain", term: q.replace(/^(explain|define)\s+/i, "") });
    else send({ type: "ask", question: q });
    setQuestion("");
  }

  const visibleCards = useMemo(() => cards.filter((c) => c.id == null || !dismissed.has(c.id)), [cards, dismissed]);
  const current = agenda[agendaIndex];

  return (
    <div className="page live-page">
      <div className="page-head">
        <div>
          <p className="rec-state">
            <span className={`rec-dot${offRecord || status !== "live" ? " paused" : ""}`} aria-hidden="true" />
            {status === "connecting" && "Connecting…"}
            {status === "live" && (offRecord ? "Off the record" : captureMode ? "Live" : "Watching live")}
            {status === "stopping" && "Saving…"}
            {status === "stopped" && "Ended"}
            {status === "error" && "Not connected"}
            <span className="rec-clock-small">{clock(elapsed)}</span>
          </p>
          <h1>{meetingTitle || "Live meeting"}</h1>
        </div>
        <div className="head-actions">
          {captureRef.current && captureMode === "meeting" && (
            <div className="meters compact">
              <Meter label="You" value={levels.mic} color="var(--voice-owner)" />
              <Meter label="Meeting" value={levels.meeting} color="var(--voice-1)" />
            </div>
          )}
          <button className={`button${offRecord ? " primary" : ""}`} onClick={toggleRecord} disabled={status !== "live"}>
            {offRecord ? "Back on the record" : "Off the record"}
          </button>
          <button className="button primary" onClick={stop} disabled={status !== "live"}>
            Stop and process
          </button>
        </div>
      </div>

      {notice && <div className="banner">{notice}</div>}
      {error && (
        <div className="banner error-banner" role="alert">
          <span>{error}</span>
          {status === "error" && <Link to={`/meetings/${id}`}>Open the meeting</Link>}
        </div>
      )}

      <div className="live-grid">
        <section className="live-transcript" aria-label="Live transcript">
          <h2>Transcript</h2>
          {lines.length === 0 && !Object.keys(partials).length && (
            <p className="muted">{status === "live" ? "Listening…" : "The transcript appears here."}</p>
          )}
          <ol className="transcript">
            {lines.map((l, i) => {
              const gap = gaps.find((g) => g[1] <= l.start && (i === 0 || g[0] >= lines[i - 1].end));
              return (
                <li key={l.id} className={`line${l.is_owner ? " mine" : ""}`}>
                  {gap && <p className="gap">Off the record {clock(gap[0])}–{clock(gap[1])}</p>}
                  <span className="stamp">{clock(l.start)}</span>
                  <div>
                    <span className="who">{l.speaker}</span>
                    <p>{l.text}</p>
                    {translations[l.id] && <p className="translation">{translations[l.id]}</p>}
                  </div>
                </li>
              );
            })}
            {Object.entries(partials).map(([speaker, text]) => (
              <li key={`p-${speaker}`} className="line partial">
                <span className="stamp">…</span>
                <div>
                  <span className="who">{speaker}</span>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div ref={transcriptEnd} />
        </section>

        <aside className="live-side">
          <form className="ask-inline" onSubmit={ask}>
            <input
              aria-label="Ask or explain"
              placeholder="Ask your history, or “explain SLA”"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={status !== "live"}
            />
            <button className="button" disabled={status !== "live" || !question.trim()}>
              Ask
            </button>
          </form>

          <div className="live-cards" aria-live="polite">
            {Object.values(pending).map((p) => (
              <article key={p.key} className="card pending">
                <p className="card-trigger">{p.speaker ? `${p.speaker}: ` : ""}{p.question}</p>
                <p className="card-answer">{p.text || "Looking through your meetings…"}</p>
              </article>
            ))}
            {visibleCards.map((c, i) => (
              <AnswerCard
                key={c.id ?? `c${i}`}
                card={c}
                onDismiss={() => c.id != null && setDismissed((d) => new Set(d).add(c.id!))}
                onFeedback={(v) => c.id != null && send({ type: "feedback", card_id: c.id, value: v })}
              />
            ))}
          </div>

          {nudges.length > 0 && (
            <section className="side-block">
              <h3>You promised</h3>
              <ul className="plain">
                {nudges.map((n) => (
                  <li key={n.id}>
                    {n.text}
                    {n.due && <span className="muted"> (due {n.due})</span>}
                    {n.stuck && <span className="tag warn">stuck</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {summaries.length > 0 && (
            <section className="side-block">
              <h3>So far</h3>
              {summaries.slice(-3).map((s) => (
                <div key={s.at} className="rolling">
                  <span className="muted small">at {clock(s.at)}</span>
                  <p className="pre">{s.text}</p>
                </div>
              ))}
            </section>
          )}

          <section className="side-block">
            <h3>Agenda and parking lot</h3>
            <AgendaEditor
              agenda={agenda}
              index={agendaIndex}
              onAdd={(item) => setAgenda((a) => [...a, item])}
              onNext={() => setAgendaIndex((i) => Math.min(agenda.length - 1, i + 1))}
            />
            {current && current.spent > current.minutes * 60 && (
              <p className="tag warn">“{current.title}” is over its {current.minutes} minutes.</p>
            )}
            <ParkingLot items={parking} onAdd={(t) => setParking((p) => [...p, t])} />
          </section>

          <section className="side-block options">
            <label>
              Translate lines into{" "}
              <select
                value={translateTo}
                onChange={(e) => send({ type: "translate", to: e.target.value || null })}
                disabled={status !== "live"}
              >
                <option value="">Off</option>
                {["English", "Spanish", "Hindi", "Telugu", "German", "French", "Japanese", "Portuguese"].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="check">
              <input type="checkbox" checked={earbud} onChange={(e) => setEarbud(e.target.checked)} />
              Earbud mode: read answers aloud
            </label>
          </section>

          {brief && <BriefPanel brief={brief} compact />}
        </aside>
      </div>
    </div>
  );
}

function AgendaEditor({
  agenda,
  index,
  onAdd,
  onNext,
}: {
  agenda: AgendaItem[];
  index: number;
  onAdd: (item: AgendaItem) => void;
  onNext: () => void;
}) {
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(5);
  return (
    <div className="agenda">
      <ol className="plain">
        {agenda.map((a, i) => (
          <li key={i} className={i === index ? "current" : i < index ? "muted" : undefined}>
            {a.title} <span className="muted small">{clock(a.spent)} / {a.minutes}:00</span>
          </li>
        ))}
      </ol>
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) onAdd({ title: title.trim(), minutes, spent: 0 });
          setTitle("");
        }}
      >
        <input aria-label="Agenda item" placeholder="Agenda item" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input aria-label="Minutes" type="number" min={1} max={120} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
        <button className="button">Add</button>
        {agenda.length > 1 && index < agenda.length - 1 && (
          <button type="button" className="button" onClick={onNext}>
            Next item
          </button>
        )}
      </form>
    </div>
  );
}

function ParkingLot({ items, onAdd }: { items: string[]; onAdd: (t: string) => void }) {
  const [t, setT] = useState("");
  return (
    <div className="parking">
      {items.length > 0 && (
        <ul className="plain">
          {items.map((x, i) => (
            <li key={i}>🅿 {x}</li>
          ))}
        </ul>
      )}
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (t.trim()) onAdd(t.trim());
          setT("");
        }}
      >
        <input aria-label="Park a tangent" placeholder="Park a tangent for later" value={t} onChange={(e) => setT(e.target.value)} />
        <button className="button">Park</button>
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
