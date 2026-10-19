import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../api";
import { useConfig } from "../App";
import { clock } from "../lib/format";
import type { ActionItem } from "../types";

export function ActionItemsPage() {
  const config = useConfig();
  const [items, setItems] = useState<ActionItem[] | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .actionItems(!showDone)
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
  }, [showDone]);

  async function toggle(item: ActionItem) {
    setItems((list) => list?.map((a) => (a.id === item.id ? { ...a, done: !a.done } : a)) ?? null);
    try {
      await api.setActionItem(item.id, !item.done);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }

  const owner = config?.owner_name?.toLowerCase();
  const visible = (items ?? []).filter((a) => !mineOnly || (owner && a.owner?.toLowerCase() === owner));

  return (
    <div className="page">
      <div className="page-head">
        <h1>Action items</h1>
        <div className="head-actions">
          <label className="check">
            <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
            Only mine
          </label>
          <label className="check">
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
            Include done
          </label>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {items === null && !error && <p className="muted">Loading…</p>}
      {items !== null && visible.length === 0 && (
        <p className="empty">Nothing open. Action items from your meeting summaries show up here.</p>
      )}
      <ul className="actions all-actions">
        {visible.map((a) => (
          <li key={a.id} className={a.done ? "done" : undefined}>
            <label>
              <input type="checkbox" checked={a.done} onChange={() => toggle(a)} />
              <span>
                {a.owner && <strong>{a.owner}: </strong>}
                {a.text}
                {a.due && <span className="muted"> (due {a.due})</span>}
              </span>
            </label>
            <Link className="timelink" to={`/meetings/${a.meeting_id}${a.at != null ? `?t=${Math.floor(a.at)}` : ""}`}>
              {a.at != null ? `Said at ${clock(a.at)}` : "Open meeting"}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
