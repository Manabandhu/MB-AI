import { Link } from "react-router-dom";
import { fullDate } from "../lib/format";
import type { Brief } from "../types";

const FOCUS_LABEL: Record<string, string> = {
  your_update: "Your update",
  open_item: "Open from last time",
  their_commitment: "They committed to",
  promise: "Past promises",
  figure: "Figures from last call",
  similar_incident: "Similar incidents",
  runbook: "Runbooks",
  prior_decision: "Prior decisions",
  last_time: "Last time",
};

/** The pre-meeting brief: attendees and your history with them, open commitments, linked docs. */
export function BriefPanel({ brief, compact = false }: { brief: Brief; compact?: boolean }) {
  const groups: Record<string, Brief["focus"]> = {};
  for (const f of brief.focus) (groups[f.kind] ??= []).push(f);
  return (
    <section className={`brief${compact ? " compact" : ""}`} aria-label="Brief">
      <h3>Brief</h3>
      <p className="muted small">{brief.profile.live_assist}</p>
      {Object.entries(groups).map(([kind, items]) => (
        <div key={kind} className="brief-group">
          <h4>{FOCUS_LABEL[kind] ?? kind}</h4>
          <ul className="plain">
            {items.map((f, i) => (
              <li key={i}>
                {f.url ? (
                  <a href={f.url} target="_blank" rel="noreferrer">
                    {f.text}
                  </a>
                ) : f.meeting_id ? (
                  <Link to={`/meetings/${f.meeting_id}${f.at != null ? `?t=${Math.floor(f.at)}` : ""}`}>{f.text}</Link>
                ) : (
                  <span className="pre">{f.text}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {brief.attendees.length > 0 && (
        <div className="brief-group">
          <h4>Who's there</h4>
          <ul className="plain">
            {brief.attendees.map((a) => (
              <li key={a.person_id}>
                <strong>{a.name}</strong>
                {a.last_meeting ? (
                  <span className="muted">
                    {" "}
                    · last met in <Link to={`/meetings/${a.last_meeting.id}`}>{a.last_meeting.title}</Link>, {fullDate(a.last_meeting.started_at)}
                  </span>
                ) : (
                  <span className="muted"> · first meeting together</span>
                )}
                {a.open_commitments.length > 0 && (
                  <ul className="plain sub">
                    {a.open_commitments.map((c) => (
                      <li key={c.id}>
                        owes: {c.text}
                        {c.due && <span className="muted"> (due {c.due})</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {brief.your_open_commitments.length > 0 && (
        <div className="brief-group">
          <h4>You owe</h4>
          <ul className="plain">
            {brief.your_open_commitments.map((c) => (
              <li key={c.id}>
                {c.text}
                {c.due && <span className="muted"> (due {c.due})</span>}
                {c.stuck && <span className="tag warn">stuck</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {brief.linked_docs.length > 0 && (
        <div className="brief-group">
          <h4>Linked docs</h4>
          <ul className="plain">
            {brief.linked_docs.map((d) => (
              <li key={d.url}>
                <a href={d.url} target="_blank" rel="noreferrer">
                  {d.title || d.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!compact && brief.last_meeting_with_them?.overview && (
        <div className="brief-group">
          <h4>Last time with them</h4>
          <p>
            <Link to={`/meetings/${brief.last_meeting_with_them.id}`}>{brief.last_meeting_with_them.title}</Link>:{" "}
            {brief.last_meeting_with_them.overview}
          </p>
        </div>
      )}
    </section>
  );
}
