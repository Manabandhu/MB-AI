import { useState } from "react";
import type { Person, Speaker } from "../types";

interface Props {
  speakers: Speaker[];
  people: Person[];
  colors: Record<string, string>;
  disabled: boolean;
  canEnroll: boolean;
  onRename: (label: string, name: string) => Promise<void>;
  onLink: (label: string, personId: string) => Promise<void>;
  onMerge: (from: string, into: string) => Promise<void>;
  onEnroll: (label: string, personId: string) => Promise<void>;
}

function MatchBadge({ s }: { s: Speaker }) {
  if (s.is_owner) return <span className="tag">your mic</span>;
  if (s.match_source === "platform") return <span className="tag ok" title="Named by the meeting platform">platform</span>;
  if (s.match_source === "voiceprint")
    return (
      <span className="tag ok" title="Recognized by an opt-in voiceprint">
        voice {s.match_score != null ? `${Math.round(s.match_score * 100)}%` : ""}
      </span>
    );
  return null;
}

/** Name the people the diarizer found, link them to People, fold duplicates, or save a voiceprint (with consent). */
export function SpeakerEditor({ speakers, people, colors, disabled, canEnroll, onRename, onLink, onMerge, onEnroll }: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [enrolling, setEnrolling] = useState<Speaker | null>(null);

  async function commit(s: Speaker) {
    const value = (drafts[s.label] ?? s.display_name).trim();
    if (!value || value === s.display_name) return;
    await onRename(s.label, value);
    setDrafts((d) => {
      const { [s.label]: _drop, ...rest } = d;
      return rest;
    });
  }

  const person = (id: string | null) => people.find((p) => p.id === id);

  return (
    <>
      <ul className="speaker-editor">
        {speakers.map((s) => (
          <li key={s.label}>
            <span className="swatch" style={{ background: colors[s.label] }} />
            <input
              aria-label={`Name for ${s.display_name}`}
              value={drafts[s.label] ?? s.display_name}
              disabled={disabled}
              onChange={(e) => setDrafts((d) => ({ ...d, [s.label]: e.target.value }))}
              onBlur={() => commit(s)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setDrafts((d) => ({ ...d, [s.label]: s.display_name }));
              }}
              list="people-names"
            />
            <MatchBadge s={s} />
            {!s.is_owner && (
              <select
                aria-label={`Who is ${s.display_name}`}
                disabled={disabled}
                value=""
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.startsWith("merge:")) onMerge(s.label, v.slice(6));
                  else if (v) onLink(s.label, v);
                }}
              >
                <option value="">{s.person_id ? "Change…" : "This is…"}</option>
                <optgroup label="People">
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name}
                    </option>
                  ))}
                </optgroup>
                {speakers.length > 1 && (
                  <optgroup label="Same person as">
                    {speakers
                      .filter((o) => o.label !== s.label)
                      .map((o) => (
                        <option key={o.label} value={`merge:${o.label}`}>
                          {o.display_name}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            )}
            {!s.is_owner && canEnroll && s.person_id && !person(s.person_id)?.has_voiceprint && (
              <button className="link small" disabled={disabled} onClick={() => setEnrolling(s)}>
                Save voiceprint
              </button>
            )}
          </li>
        ))}
      </ul>
      <datalist id="people-names">
        {people.map((p) => (
          <option key={p.id} value={p.display_name} />
        ))}
      </datalist>
      {enrolling && (
        <div className="banner consent-box" role="dialog" aria-label="Voiceprint consent">
          <span>
            Save a voiceprint for <strong>{enrolling.display_name}</strong> from this meeting? Only an embedding is kept, and it can
            be deleted at any time. Do this only if they agreed.
          </span>
          <button
            className="button primary"
            onClick={async () => {
              await onEnroll(enrolling.label, enrolling.person_id!);
              setEnrolling(null);
            }}
          >
            They agreed: save it
          </button>
          <button className="link" onClick={() => setEnrolling(null)}>
            Cancel
          </button>
        </div>
      )}
    </>
  );
}
