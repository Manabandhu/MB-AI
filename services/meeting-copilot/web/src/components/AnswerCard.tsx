import { useState } from "react";
import { Link } from "react-router-dom";
import { clock, fullDate } from "../lib/format";
import type { CardSource, LiveCard } from "../types";

const KIND_LABEL: Record<string, string> = {
  answer: "Answer",
  explain: "Explain",
  nudge: "You promised",
  keyword: "Watched topic",
  update: "Your update",
};

function chipLink(s: CardSource): string | null {
  if (s.url) return s.url;
  if (!s.meeting_id) return null;
  return `/meetings/${s.meeting_id}${s.start != null ? `?t=${Math.floor(s.start)}` : ""}`;
}

/** 1–2 sentences, up to three supporting facts, source chips, copy, dismiss and thumbs up/down. */
export function AnswerCard({
  card,
  onDismiss,
  onFeedback,
}: {
  card: LiveCard;
  onDismiss?: () => void;
  onFeedback?: (value: number) => void;
}) {
  const [rated, setRated] = useState(card.feedback ?? 0);
  const [copied, setCopied] = useState(false);
  const notInHistory = !card.grounded;
  const total = card.timings_ms?.total;
  return (
    <article className={`card kind-${card.kind}${notInHistory ? " not-found" : ""}`}>
      <header className="card-head">
        <span className="card-kind">{KIND_LABEL[card.kind] ?? card.kind}</span>
        {card.trigger_text && card.kind !== "update" && (
          <span className="card-trigger" title={card.trigger_text}>
            {card.speaker ? `${card.speaker}: ` : ""}
            {card.trigger_text}
          </span>
        )}
        {total != null && total > 0 && (
          <span className={`latency${total > 3000 ? " slow" : ""}`} title="Time from the question to the finished card">
            {(total / 1000).toFixed(1)} s
          </span>
        )}
      </header>
      <p className="card-answer">{card.answer}</p>
      {card.facts.length > 0 && (
        <ul className="card-facts">
          {card.facts.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}
      {card.sources.length > 0 && (
        <div className="chips">
          {card.sources.map((s) => {
            const href = chipLink(s);
            const label = `${s.meeting_title}${s.started_at ? `, ${fullDate(s.started_at)}` : ""}${s.start != null ? ` at ${clock(s.start)}` : ""}`;
            if (!href) return <span key={s.n} className="chip" title={s.text}>{label}</span>;
            return s.url ? (
              <a key={s.n} className="chip" href={href} target="_blank" rel="noreferrer" title={s.text}>
                {label}
              </a>
            ) : (
              <Link key={s.n} className="chip" to={href} title={s.text}>
                {label}
              </Link>
            );
          })}
        </div>
      )}
      <footer className="card-actions">
        <button
          className="link"
          onClick={() => {
            navigator.clipboard?.writeText(card.answer).then(() => setCopied(true));
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
        {onFeedback && card.id != null && (
          <>
            <button
              className={`link${rated === 1 ? " on" : ""}`}
              aria-label="Useful"
              aria-pressed={rated === 1}
              onClick={() => {
                setRated(1);
                onFeedback(1);
              }}
            >
              👍
            </button>
            <button
              className={`link${rated === -1 ? " on" : ""}`}
              aria-label="Not useful"
              aria-pressed={rated === -1}
              onClick={() => {
                setRated(-1);
                onFeedback(-1);
              }}
            >
              👎
            </button>
          </>
        )}
        {onDismiss && (
          <button className="link" onClick={onDismiss}>
            Dismiss
          </button>
        )}
      </footer>
    </article>
  );
}
