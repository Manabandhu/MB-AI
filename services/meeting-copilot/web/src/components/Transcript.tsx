import { useEffect, useRef } from "react";
import { clock } from "../lib/format";
import type { Segment } from "../types";

interface Props {
  segments: Segment[];
  names: Record<string, string>;
  colors: Record<string, string>;
  currentTime: number;
  playing: boolean;
  onSeek: (t: number) => void;
  highlight?: number | null; // seconds, from a ?t= link
}

export function Transcript({ segments, names, colors, currentTime, playing, onSeek, highlight }: Props) {
  const activeRef = useRef<HTMLLIElement>(null);
  const activeIndex = segments.findIndex((s) => currentTime >= s.start && currentTime < s.end + 0.5);
  const highlightIndex =
    highlight == null ? -1 : segments.findIndex((s) => highlight >= s.start - 0.5 && highlight < s.end + 0.5);

  useEffect(() => {
    if (playing) activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex, playing]);

  useEffect(() => {
    if (highlightIndex >= 0) {
      document.getElementById(`seg-${segments[highlightIndex].id}`)?.scrollIntoView({ block: "center" });
    }
    // Scroll to a linked line once, when the link target changes.
  }, [highlightIndex]);

  if (segments.length === 0) {
    return <p className="empty">No speech was found in this recording.</p>;
  }

  return (
    <ol className="transcript">
      {segments.map((seg, i) => {
        const active = i === activeIndex;
        return (
          <li
            key={seg.id}
            id={`seg-${seg.id}`}
            ref={active ? activeRef : undefined}
            className={`line${active ? " active" : ""}${i === highlightIndex ? " linked" : ""}`}
            style={{ ["--voice" as string]: colors[seg.speaker_label] }}
          >
            <button className="stamp" onClick={() => onSeek(seg.start)} aria-label={`Play from ${clock(seg.start)}`}>
              {clock(seg.start)}
            </button>
            <div>
              <span className="who">{names[seg.speaker_label] ?? seg.speaker_label}</span>
              <p>{seg.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
