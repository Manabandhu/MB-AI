import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError, api, saveText } from "../api";
import { useConfig } from "../App";
import { clock, fullDate, isoDay } from "../lib/format";
import type { Decision, Gate, LiveMetrics, RadarItem, Rehearsal, Rollup, SpeakerMetrics, StandupDraft } from "../types";

const TABS = [
  { key: "standup", label: "My standup" },
  { key: "rollup", label: "Rollup" },
  { key: "radar", label: "Blocker radar" },
  { key: "decisions", label: "Decisions" },
  { key: "gates", label: "Gates" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export function InsightsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "standup";
  return (
    <div className="page">
      <div className="page-head">
        <h1>Insights</h1>
        <div className="segmented" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? "on" : ""} onClick={() => setParams({ tab: t.key })}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === "standup" && <StandupTab />}
      {tab === "rollup" && <RollupTab />}
      {tab === "radar" && <RadarTab />}
      {tab === "decisions" && <DecisionsTab />}
      {tab === "gates" && <GatesTab />}
    </div>
  );
}

function useError(): [string | null, (e: unknown) => void, () => void] {
  const [error, setError] = useState<string | null>(null);
  return [error, (e) => setError(e instanceof ApiError ? e.message : String(e)), () => setError(null)];
}

function StandupTab() {
  const [draft, setDraft] = useState<StandupDraft | null>(null);
  const [text, setText] = useState("");
  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, fail] = useError();

  async function makeDraft() {
    setBusy(true);
    try {
      const d = await api.standupDraft();
      setDraft(d);
      setText(d.text);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="two-col">
      <div>
        <h2>Pre-drafted update</h2>
        <p className="muted">From your Jira, GitHub and CI activity since your last standup, and what you committed to last time.</p>
        <button className="button primary" onClick={makeDraft} disabled={busy}>
          {busy ? "Drafting…" : draft ? "Draft again" : "Draft my update"}
        </button>
        {draft && (
          <div className="summary">
            {(["yesterday", "today", "blockers"] as const).map((k) =>
              draft[k].length ? (
                <div key={k} className={`update ${k === "blockers" ? "blocker" : ""}`}>
                  <h4>{k[0].toUpperCase() + k.slice(1)}</h4>
                  <ul>
                    {draft[k].map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>
      <div>
        <h2>Rehearse</h2>
        <p className="muted">Paste or type what you plan to say; get it back tightened to under a minute.</p>
        <textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} aria-label="Your update" />
        <button
          className="button"
          disabled={!text.trim() || busy}
          onClick={async () => {
            setBusy(true);
            try {
              setRehearsal(await api.rehearse(text));
            } catch (e) {
              fail(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          Tighten it
        </button>
        {rehearsal && (
          <div className="rehearsal">
            <p className="muted small">
              {rehearsal.seconds_before}s → {rehearsal.seconds_after}s spoken{rehearsal.under_a_minute ? " · under a minute" : ""}
            </p>
            <p className="pre">{rehearsal.text}</p>
          </div>
        )}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function RollupTab() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const [since, setSince] = useState(isoDay(monday));
  const [until, setUntil] = useState(isoDay(today));
  const [data, setData] = useState<Rollup | null>(null);
  const [error, fail] = useError();

  useEffect(() => {
    setData(null);
    api.rollup(since, until).then(setData).catch(fail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [since, until]);

  return (
    <section>
      <div className="head-actions range">
        <label>
          From <input type="date" value={since} onChange={(e) => setSince(e.target.value)} />
        </label>
        <label>
          to <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
        </label>
        <button className="button" onClick={() => api.rollupMarkdown(since, until).then((md) => saveText(`rollup-${since}.md`, md)).catch(fail)}>
          Download for a retro or report
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {!data && !error && <p className="muted">Loading…</p>}
      {data && (
        <>
          <p className="stats">
            <span>
              <strong>{data.meetings.length}</strong> meetings
            </span>
            <span>
              <strong>{Math.round(data.timesheet.total_minutes)}</strong> min in meetings
            </span>
            <span>
              <strong>{data.totals.done}</strong> done
            </span>
            <span>
              <strong>{data.totals.open}</strong> open
            </span>
            <span className={data.totals.stuck ? "warn" : ""}>
              <strong>{data.totals.stuck}</strong> stuck
            </span>
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Done</th>
                <th>Open</th>
                <th>Stuck</th>
                <th>Blockers raised</th>
                <th>Talk time</th>
              </tr>
            </thead>
            <tbody>
              {data.people.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td title={p.done.map((c) => c.text).join("\n")}>{p.done.length}</td>
                  <td title={p.open.map((c) => c.text).join("\n")}>{p.open.length}</td>
                  <td className={p.stuck.length ? "warn" : ""} title={p.stuck.map((c) => c.text).join("\n")}>
                    {p.stuck.length}
                  </td>
                  <td>
                    {p.blockers.slice(0, 2).map((b, i) => (
                      <div key={i} className="small">
                        <Link to={`/meetings/${b.meeting_id}`}>{b.text}</Link>
                      </div>
                    ))}
                  </td>
                  <td>{p.talk_minutes} min</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="two-col">
            <div>
              <h3>Time by meeting type</h3>
              <BarList data={data.timesheet.by_profile} unit="min" />
            </div>
            <div>
              <h3>Time by day</h3>
              <BarList data={data.timesheet.by_day} unit="min" />
            </div>
          </div>
          {data.decisions.length > 0 && (
            <>
              <h3>Decisions</h3>
              <ul>
                {data.decisions.map((d, i) => (
                  <li key={i}>
                    {d.text} <Link className="muted small" to={`/meetings/${d.meeting_id}`}>{d.meeting_title}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}

function BarList({ data, unit }: { data: Record<string, number>; unit: string }) {
  const max = Math.max(1, ...Object.values(data));
  const entries = Object.entries(data);
  if (!entries.length) return <p className="muted">Nothing yet.</p>;
  return (
    <ul className="bars">
      {entries.map(([k, v]) => (
        <li key={k}>
          <span className="bar-label">{k.replace(/_/g, " ")}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${(v / max) * 100}%` }} />
          </span>
          <span className="bar-value">
            {Math.round(v)} {unit}
          </span>
        </li>
      ))}
    </ul>
  );
}

function RadarTab() {
  const [days, setDays] = useState(14);
  const [items, setItems] = useState<RadarItem[] | null>(null);
  const [error, fail] = useError();
  useEffect(() => {
    api.blockerRadar(days).then(setItems).catch(fail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);
  return (
    <section>
      <p className="muted lede">
        Blockers that keep coming back across standups, grouped by the system or team they name. Recurring cross-team dependencies,
        turned into nudges.
      </p>
      <label>
        Look back{" "}
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {[7, 14, 30, 60].map((d) => (
            <option key={d} value={d}>
              {d} days
            </option>
          ))}
        </select>
      </label>
      {error && <p className="error">{error}</p>}
      {items?.length === 0 && <p className="empty">No recurring blockers. Nice.</p>}
      <ul className="radar">
        {items?.map((r) => (
          <li key={r.topic}>
            <h3>{r.topic}</h3>
            <p>{r.nudge}</p>
            <p className="muted small">
              {r.standups} standups · {r.people.join(", ")} · {fullDate(r.first_seen)} to {fullDate(r.last_seen)}
            </p>
            <ul className="plain sub">
              {r.examples.map((x, i) => (
                <li key={i}>“{x}”</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DecisionsTab() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Decision[] | null>(null);
  const [error, fail] = useError();
  useEffect(() => {
    const t = window.setTimeout(() => api.decisions(q.trim() || undefined).then(setItems).catch(fail), q ? 250 : 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  return (
    <section>
      <input type="search" placeholder="Search decisions" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search decisions" />
      {error && <p className="error">{error}</p>}
      {items?.length === 0 && <p className="empty">No decisions recorded yet.</p>}
      <ul className="decisions">
        {items?.map((d) => (
          <li key={d.id}>
            <p>{d.text}</p>
            <p className="muted small">
              {d.owner && `${d.owner} · `}
              <Link to={`/meetings/${d.meeting_id}${d.at != null ? `?t=${Math.floor(d.at)}` : ""}`}>
                {d.meeting_title}
                {d.at != null ? ` at ${clock(d.at)}` : ""}
              </Link>
              , {fullDate(d.decided_at)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function GatesTab() {
  const config = useConfig();
  const [gates, setGates] = useState<Gate[] | null>(null);
  const [speakers, setSpeakers] = useState<SpeakerMetrics | null>(null);
  const [live, setLive] = useState<LiveMetrics | null>(null);
  const [error, fail] = useError();
  useEffect(() => {
    api.gates().then(setGates).catch(fail);
    api.speakerMetrics().then(setSpeakers).catch(fail);
    api.liveMetrics().then(setLive).catch(fail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <section>
      <p className="muted lede">Each roadmap phase opens only when its gate passes on your own meetings.</p>
      {error && <p className="error">{error}</p>}
      <ol className="gates">
        {gates?.map((g) => (
          <li key={g.phase} className={g.passed === true ? "pass" : g.passed === false ? "fail" : "pending"}>
            <span className="gate-mark" aria-hidden="true">
              {g.passed === true ? "✓" : g.passed === false ? "✕" : "…"}
            </span>
            <div>
              <h3>
                Phase {g.phase} · {g.name}
              </h3>
              <p>{g.target}</p>
              <p className="muted small">
                {g.value}. {g.detail}
              </p>
              {g.phase === 4 && !g.passed && config?.role === "owner" && (
                <button
                  className="button"
                  onClick={() => {
                    const note = prompt("Who reviewed the consent and data-handling flows, and when?");
                    if (note) api.signOffReview(note).then(setGates).catch(fail);
                  }}
                >
                  Record the review sign-off
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="two-col">
        {speakers && (
          <div>
            <h3>Speaker accuracy (14 days)</h3>
            <p>
              {speakers.accuracy == null ? "No data yet." : `${(speakers.accuracy * 100).toFixed(1)}% of ${speakers.turns} turns right`}
            </p>
            <p className="muted small">
              {speakers.corrected_turns} corrected · {speakers.voiceprint_matches} voiceprint matches, {speakers.voiceprint_wrong} wrong
              {speakers.suggested_threshold != null && ` · suggested VOICEPRINT_THRESHOLD ${speakers.suggested_threshold}`}
            </p>
          </div>
        )}
        {live && (
          <div>
            <h3>Answer cards (14 days)</h3>
            <p>
              {live.cards} cards
              {live.within_target != null && ` · ${(live.within_target * 100).toFixed(0)}% within 3 s`}
              {live.useful != null && ` · ${(live.useful * 100).toFixed(0)}% rated useful`}
            </p>
            <p className="muted small">
              median {live.median_ms ?? "–"} ms · p90 {live.p90_ms ?? "–"} ms · {live.not_in_history} “not in your history”
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
