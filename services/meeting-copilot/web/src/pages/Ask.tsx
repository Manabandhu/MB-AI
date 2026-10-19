import { FormEvent, Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../api";
import { clock, fullDate } from "../lib/format";
import type { Source } from "../types";

interface Turn {
  question: string;
  answer?: string;
  sources?: Source[];
  error?: string;
}

const STARTERS = [
  "What did I say I'd get done this week?",
  "Who is blocked right now, and on what?",
  "What did we decide in the last planning discussion?",
];

function sourceLink(s: Source) {
  return `/meetings/${s.meeting_id}${s.start != null ? `?t=${Math.floor(s.start)}` : ""}`;
}

/** Turn "... [S2][S4]" into text with links to the cited moments. */
function AnswerText({ text, sources }: { text: string; sources: Source[] }) {
  const parts = text.split(/(\[S\d+\])/g);
  return (
    <p className="answer-text">
      {parts.map((part, i) => {
        const m = part.match(/^\[S(\d+)\]$/);
        const src = m ? sources.find((s) => s.n === Number(m[1])) : undefined;
        if (!src) return <Fragment key={i}>{part}</Fragment>;
        return (
          <Link
            key={i}
            to={sourceLink(src)}
            className="cite"
            title={`${src.meeting_title}, ${fullDate(src.started_at)}${src.start != null ? ` at ${clock(src.start)}` : ""}`}
          >
            {src.n}
          </Link>
        );
      })}
    </p>
  );
}

export function AskPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }), [turns]);

  async function ask(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    const history = turns.flatMap((t) =>
      t.answer
        ? [
            { role: "user" as const, content: t.question },
            { role: "assistant" as const, content: t.answer },
          ]
        : [],
    );
    setTurns((ts) => [...ts, { question: text }]);
    setQuestion("");
    setBusy(true);
    try {
      const res = await api.chat(text, history, since, until);
      setTurns((ts) => ts.map((t, i) => (i === ts.length - 1 ? { ...t, answer: res.answer, sources: res.sources } : t)));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : String(e);
      setTurns((ts) => ts.map((t, i) => (i === ts.length - 1 ? { ...t, error: msg } : t)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page ask">
      <div className="page-head">
        <h1>Ask your meetings</h1>
        <div className="head-actions range">
          <label>
            From <input type="date" value={since} onChange={(e) => setSince(e.target.value)} />
          </label>
          <label>
            to <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
          </label>
        </div>
      </div>

      {turns.length === 0 && (
        <div className="starters">
          <p className="muted">Answers come only from your recorded meetings, with links to the moment it was said.</p>
          <ul>
            {STARTERS.map((s) => (
              <li key={s}>
                <button className="link" onClick={() => ask(s)}>
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="thread">
        {turns.map((t, i) => (
          <div key={i} className="turn-pair">
            <p className="question">{t.question}</p>
            {t.answer && (
              <div className="answer">
                <AnswerText text={t.answer} sources={t.sources ?? []} />
                {t.sources && t.sources.length > 0 && (
                  <details className="sources">
                    <summary>
                      {t.sources.length} {t.sources.length === 1 ? "source" : "sources"}
                    </summary>
                    <ol>
                      {t.sources.map((s) => (
                        <li key={s.n} value={s.n}>
                          <Link to={sourceLink(s)}>
                            {s.meeting_title}, {fullDate(s.started_at)}
                            {s.start != null ? ` at ${clock(s.start)}` : " (summary)"}
                          </Link>
                          <blockquote>{s.text.length > 400 ? `${s.text.slice(0, 400)}…` : s.text}</blockquote>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
              </div>
            )}
            {t.error && (
              <p className="error" role="alert">
                {t.error}
              </p>
            )}
            {!t.answer && !t.error && <p className="muted thinking">Searching your meetings…</p>}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="ask-box"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <textarea
          aria-label="Your question"
          rows={2}
          placeholder="Ask about anything that was said in a meeting"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(question);
            }
          }}
        />
        <button className="button primary" disabled={busy || !question.trim()}>
          Ask
        </button>
      </form>
    </div>
  );
}
