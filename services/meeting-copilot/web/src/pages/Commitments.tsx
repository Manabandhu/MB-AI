import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../api";
import { clock, fullDate } from "../lib/format";
import type { Commitment } from "../types";

const FILTERS = [
  { key: "open", label: "Open" },
  { key: "stuck", label: "Stuck" },
  { key: "overdue", label: "Overdue" },
  { key: "done", label: "Done" },
  { key: "all", label: "All" },
] as const;

/** Who owes what, by when, across every meeting. Carried over three days without progress = stuck. */
export function CommitmentsPage() {
  const [status, setStatus] = useState<(typeof FILTERS)[number]["key"]>("open");
  const [mine, setMine] = useState(false);
  const [items, setItems] = useState<Commitment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(null);
    api
      .commitments(status, mine)
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
  }, [status, mine]);

  async function setDone(c: Commitment, next: "open" | "done" | "dropped") {
    setItems((list) => list?.map((x) => (x.id === c.id ? { ...x, status: next } : x)) ?? null);
    try {
      await api.updateCommitment(c.id, { status: next });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>Commitments</h1>
        <div className="head-actions">
          <div className="segmented" role="tablist" aria-label="Filter">
            {FILTERS.map((f) => (
              <button key={f.key} role="tab" aria-selected={status === f.key} className={status === f.key ? "on" : ""} onClick={() => setStatus(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          <label className="check">
            <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
            Only mine
          </label>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {items === null && !error && <p className="muted">Loading…</p>}
      {items?.length === 0 && (
        <p className="empty">
          {status === "stuck"
            ? "Nothing is stuck. Items show up here when they're carried over three days or more."
            : "Nothing here. Every “I'll do X by Y” from your meeting summaries is tracked here."}
        </p>
      )}
      <ul className="commitments">
        {items?.map((c) => (
          <li key={c.id} className={c.status !== "open" ? "done" : undefined}>
            <label className="check-row">
              <input type="checkbox" checked={c.status === "done"} onChange={() => setDone(c, c.status === "done" ? "open" : "done")} />
              <span>
                <strong>{c.owner ?? "Unassigned"}: </strong>
                {c.text}
                {c.due && <span className="muted"> (due {c.due}{c.due_date ? `, ${c.due_date}` : ""})</span>}
              </span>
            </label>
            <div className="tags">
              {c.stuck && <span className="tag warn">stuck {c.mention_count}×</span>}
              {c.overdue && <span className="tag danger">overdue</span>}
              {c.mine && <span className="tag">you</span>}
              {c.jira_key && <span className="tag">{c.jira_key}</span>}
              {c.status === "open" && (
                <button className="link small" onClick={() => setDone(c, "dropped")}>
                  Drop
                </button>
              )}
            </div>
            <ol className="mentions">
              {c.mentions.map((m, i) => (
                <li key={i}>
                  <Link to={`/meetings/${m.meeting_id}${m.at != null ? `?t=${Math.floor(m.at)}` : ""}`}>
                    {m.kind === "made" ? "Said in" : m.kind === "done" ? "Done per" : "Again in"} {m.meeting_title}
                  </Link>{" "}
                  <span className="muted small">
                    {fullDate(m.said_at)}
                    {m.at != null ? ` at ${clock(m.at)}` : ""}
                  </span>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
    </div>
  );
}
