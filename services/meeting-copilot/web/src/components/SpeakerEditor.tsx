import { useState } from "react";
import type { Speaker } from "../types";

interface Props {
  speakers: Speaker[];
  colors: Record<string, string>;
  disabled: boolean;
  onRename: (label: string, name: string) => Promise<void>;
  onMerge: (from: string, into: string) => Promise<void>;
}

/** Name the people the diarizer found, or fold a duplicate label into the right person. */
export function SpeakerEditor({ speakers, colors, disabled, onRename, onMerge }: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function commit(s: Speaker) {
    const value = (drafts[s.label] ?? s.display_name).trim();
    if (!value || value === s.display_name) return;
    await onRename(s.label, value);
    setDrafts((d) => {
      const { [s.label]: _drop, ...rest } = d;
      return rest;
    });
  }

  return (
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
          />
          {!s.is_owner && speakers.length > 1 && (
            <select
              aria-label={`Merge ${s.display_name} into another speaker`}
              disabled={disabled}
              value=""
              onChange={(e) => e.target.value && onMerge(s.label, e.target.value)}
            >
              <option value="">Same person as…</option>
              {speakers
                .filter((o) => o.label !== s.label)
                .map((o) => (
                  <option key={o.label} value={o.label}>
                    {o.display_name}
                  </option>
                ))}
            </select>
          )}
          {s.is_owner && <span className="muted">your mic</span>}
        </li>
      ))}
    </ul>
  );
}
