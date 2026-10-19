import { useState } from "react";
import { clock } from "../lib/format";
import { colorForName } from "../lib/speakers";
import type { ActionItem, DecisionItem, Speaker, Summary } from "../types";

interface Props {
  summary: Summary;
  actionItems: ActionItem[];
  speakers: Speaker[];
  colors: Record<string, string>;
  onSeek: (t: number) => void;
  onToggleAction: (item: ActionItem) => void;
  onEditOverview?: (text: string) => void;
  renderActionExtra?: (item: ActionItem) => React.ReactNode;
}

function TimeLink({ at, onSeek }: { at: number | null | undefined; onSeek: (t: number) => void }) {
  if (at == null) return null;
  return (
    <button className="timelink" onClick={() => onSeek(at)} aria-label={`Play from ${clock(at)}`}>
      {clock(at)}
    </button>
  );
}

function Items({ title, items, tone }: { title: string; items: string[]; tone?: "blocker" }) {
  if (!items.length) return null;
  return (
    <div className={`update ${tone ?? ""}`}>
      <h4>{title}</h4>
      <ul>
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

const asDecision = (d: string | DecisionItem): DecisionItem => (typeof d === "string" ? { text: d } : d);

export function SummaryView({ summary, actionItems, speakers, colors, onSeek, onToggleAction, onEditOverview, renderActionExtra }: Props) {
  const [editing, setEditing] = useState(false);
  const fields = summary.fields ?? {};
  const meta = summary.fields_meta ?? Object.keys(fields).map((k) => ({ key: k, label: k.replace(/_/g, " "), hint: "", type: "list" as const }));
  return (
    <div className="summary">
      {editing ? (
        <textarea
          className="overview-edit"
          defaultValue={summary.overview}
          autoFocus
          rows={4}
          aria-label="Overview"
          onBlur={(e) => {
            setEditing(false);
            if (e.target.value.trim() !== summary.overview) onEditOverview?.(e.target.value.trim());
          }}
        />
      ) : (
        summary.overview && (
          <p className="overview">
            {summary.overview}{" "}
            {onEditOverview && (
              <button className="link small" onClick={() => setEditing(true)}>
                Edit
              </button>
            )}
          </p>
        )
      )}

      {summary.people.length > 0 && (
        <section>
          <h3>Updates</h3>
          {summary.people.map((p) => (
            <article
              className="person"
              key={p.name}
              style={{ ["--voice" as string]: colorForName(p.name, speakers, colors) ?? "var(--rule-strong)" }}
            >
              <h4 className="person-name">{p.name}</h4>
              <Items title="Yesterday" items={p.yesterday} />
              <Items title="Today" items={p.today} />
              <Items title="Blockers" items={p.blockers} tone="blocker" />
              {!p.yesterday.length && !p.today.length && !p.blockers.length && <p className="muted">No update captured.</p>}
            </article>
          ))}
        </section>
      )}

      {actionItems.length > 0 && (
        <section>
          <h3>Action items</h3>
          <ul className="actions">
            {actionItems.map((a) => (
              <li key={a.id} className={a.done ? "done" : undefined}>
                <label>
                  <input type="checkbox" checked={a.done} onChange={() => onToggleAction(a)} />
                  <span>
                    {a.owner && <strong>{a.owner}: </strong>}
                    {a.text}
                    {a.due && <span className="muted"> (due {a.due})</span>}
                  </span>
                </label>
                <span className="action-extra">
                  {renderActionExtra?.(a)}
                  <TimeLink at={a.at} onSeek={onSeek} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {meta.map((f) => {
        const value = fields[f.key];
        if (!value || (Array.isArray(value) && !value.length)) return null;
        return (
          <section key={f.key}>
            <h3>{f.label}</h3>
            {Array.isArray(value) ? (
              <ul>
                {value.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            ) : (
              <p className="pre field-text">{value}</p>
            )}
          </section>
        );
      })}

      {summary.decisions.length > 0 && (
        <section>
          <h3>Decisions</h3>
          <ul>
            {summary.decisions.map(asDecision).map((d, i) => (
              <li key={i}>
                {d.text}
                {d.owner && <span className="muted"> ({d.owner})</span>} <TimeLink at={d.at} onSeek={onSeek} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.key_points.length > 0 && (
        <section>
          <h3>Discussion</h3>
          <ul className="points">
            {summary.key_points.map((k, i) => (
              <li key={i}>
                <span>{k.text}</span> <TimeLink at={k.at} onSeek={onSeek} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.open_questions.length > 0 && (
        <section>
          <h3>Still open</h3>
          <ul>
            {summary.open_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </section>
      )}

      {summary.entities && summary.entities.length > 0 && (
        <section>
          <h3>Mentioned</h3>
          <p className="chips">
            {summary.entities.map((e) => (
              <span key={`${e.kind}:${e.name}`} className="chip" title={e.kind}>
                {e.name}
              </span>
            ))}
          </p>
        </section>
      )}
    </div>
  );
}
