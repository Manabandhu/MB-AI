import { clock } from "../lib/format";
import { colorForName } from "../lib/speakers";
import type { ActionItem, Speaker, Summary } from "../types";

interface Props {
  summary: Summary;
  actionItems: ActionItem[];
  speakers: Speaker[];
  colors: Record<string, string>;
  onSeek: (t: number) => void;
  onToggleAction: (item: ActionItem) => void;
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

export function SummaryView({ summary, actionItems, speakers, colors, onSeek, onToggleAction }: Props) {
  return (
    <div className="summary">
      {summary.overview && <p className="overview">{summary.overview}</p>}

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
              {!p.yesterday.length && !p.today.length && !p.blockers.length && (
                <p className="muted">No update captured.</p>
              )}
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
                <TimeLink at={a.at} onSeek={onSeek} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.decisions.length > 0 && (
        <section>
          <h3>Decisions</h3>
          <ul>
            {summary.decisions.map((d, i) => (
              <li key={i}>{d}</li>
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
    </div>
  );
}
