import { Fragment, useEffect, useRef } from "react";
import { clock } from "../lib/format";
import type { Segment, Speaker } from "../types";

interface Props {
  segments: Segment[];
  speakers: Speaker[];
  names: Record<string, string>;
  colors: Record<string, string>;
  currentTime: number;
  playing: boolean;
  onSeek: (t: number) => void;
  onFix?: (segmentId: number, label: string) => void;
  gaps?: [number, number][];
  highlight?: number | null; // seconds, from a ?t= link
}

export function Transcript({ segments, speakers, names, colors, currentTime, playing, onSeek, onFix, gaps = [], highlight }: Props) {
  const activeRef = useRef<HTMLLIElement>(null);
  const activeIndex = segments.findIndex((s) => currentTime >= s.start && currentTime < s.end + 0.5);
  const highlightIndex =
    highlight == null ? -1 : segments.findIndex((s) => highlight >= s.start - 0.5 && highlight < s.end + 0.5);

  useEffect(() => {
    if (playing) activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex, playing]);

  useEffect(() => {
    if (highlightIndex >= 0) document.getElementById(`seg-${segments[highlightIndex].id}`)?.scrollIntoView({ block: "center" });
    // Scroll to a linked line once, when the link target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightIndex]);

  if (segments.length === 0) return <p className="empty">No speech was found in this recording.</p>;

  const pending = [...gaps].sort((a, b) => a[0] - b[0]);
  return (
    <ol className="transcript">
      {segments.map((seg, i) => {
        const before: [number, number][] = [];
        while (pending.length && pending[0][0] <= seg.start) before.push(pending.shift()!);
        const active = i === activeIndex;
        return (
          <Fragment key={seg.id}>
            {before.map((g) => (
              <li key={`gap-${g[0]}`} className="gap">
                Off the record {clock(g[0])}–{clock(g[1])}
              </li>
            ))}
            <li
              id={`seg-${seg.id}`}
              ref={active ? activeRef : undefined}
              className={`line${active ? " active" : ""}${i === highlightIndex ? " linked" : ""}`}
              style={{ ["--voice" as string]: colors[seg.speaker_label] }}
            >
              <button className="stamp" onClick={() => onSeek(seg.start)} aria-label={`Play from ${clock(seg.start)}`}>
                {clock(seg.start)}
              </button>
              <div>
                <span className="who">
                  {names[seg.speaker_label] ?? seg.speaker_label}
                  {onFix && (
                    <select
                      className="fix-speaker"
                      aria-label="Fix speaker for this line"
                      value=""
                      onChange={(e) => e.target.value && onFix(seg.id, e.target.value)}
                    >
                      <option value="">Fix speaker</option>
                      {speakers
                        .filter((s) => s.label !== seg.speaker_label)
                        .map((s) => (
                          <option key={s.label} value={s.label}>
                            {s.display_name}
                          </option>
                        ))}
                      <option value="new">Someone new</option>
                    </select>
                  )}
                </span>
                <p>{seg.text}</p>
              </div>
            </li>
          </Fragment>
        );
      })}
      {pending.map((g) => (
        <li key={`gap-${g[0]}`} className="gap">
          Off the record {clock(g[0])}–{clock(g[1])}
        </li>
      ))}
    </ol>
  );
}
