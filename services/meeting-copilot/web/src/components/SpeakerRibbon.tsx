import { useMemo, useRef } from "react";
import { clock, talkTime } from "../lib/format";
import type { Segment, Speaker } from "../types";

interface Props {
  speakers: Speaker[];
  segments: Segment[];
  colors: Record<string, string>;
  duration: number;
  currentTime: number;
  playing: boolean;
  hasAudio: boolean;
  onSeek: (t: number) => void;
  onTogglePlay: () => void;
}

/** One lane per speaker showing when they talked. Doubles as the audio scrubber. */
export function SpeakerRibbon({
  speakers,
  segments,
  colors,
  duration,
  currentTime,
  playing,
  hasAudio,
  onSeek,
  onTogglePlay,
}: Props) {
  const total = Math.max(duration, segments.at(-1)?.end ?? 0, 1);
  const tracksRef = useRef<HTMLDivElement>(null);

  const lanes = useMemo(
    () =>
      speakers.map((s) => {
        const mine = segments.filter((seg) => seg.speaker_label === s.label);
        return { speaker: s, segments: mine, talk: mine.reduce((acc, seg) => acc + (seg.end - seg.start), 0) };
      }),
    [speakers, segments],
  );
  const totalTalk = lanes.reduce((a, l) => a + l.talk, 0) || 1;

  const ticks = useMemo(() => {
    const step = [60, 120, 300, 600, 900, 1800].find((s) => total / s <= 6) ?? 3600;
    const out: number[] = [];
    for (let t = 0; t <= total; t += step) out.push(t);
    return out;
  }, [total]);

  function seekFromPointer(clientX: number) {
    const el = tracksRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(fraction * total);
  }

  const pct = (t: number) => `${(t / total) * 100}%`;

  return (
    <section className="ribbon" aria-label="Who spoke when">
      <div className="ribbon-controls">
        <button
          className="play"
          onClick={onTogglePlay}
          disabled={!hasAudio}
          aria-label={playing ? "Pause" : "Play"}
          title={hasAudio ? undefined : "Audio was removed by the retention policy; the transcript stays."}
        >
          {playing ? (
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <rect x="5" y="4" width="3.5" height="12" rx="1" />
              <rect x="11.5" y="4" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6 4.2v11.6c0 .8.9 1.3 1.6.8l8.6-5.8c.6-.4.6-1.2 0-1.6L7.6 3.4C6.9 2.9 6 3.4 6 4.2z" />
            </svg>
          )}
        </button>
        <span className="ribbon-time">
          {clock(currentTime)} <span className="muted">of {clock(total)}</span>
        </span>
      </div>

      <div className="ribbon-grid">
        <div className="ribbon-names">
          {lanes.map(({ speaker, talk }) => (
            <div className="ribbon-name" key={speaker.label}>
              <span className="swatch" style={{ background: colors[speaker.label] }} />
              <span className="name">{speaker.display_name}</span>
              <span className="muted share">
                {talkTime(talk)}, {Math.round((talk / totalTalk) * 100)}%
              </span>
            </div>
          ))}
        </div>

        <div
          className="ribbon-tracks"
          ref={tracksRef}
          role="slider"
          tabIndex={0}
          aria-label="Playback position"
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={clock(currentTime)}
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture?.(e.pointerId);
            seekFromPointer(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) seekFromPointer(e.clientX);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") onSeek(Math.min(total, currentTime + 5));
            else if (e.key === "ArrowLeft") onSeek(Math.max(0, currentTime - 5));
            else if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              onTogglePlay();
            } else return;
            e.preventDefault();
          }}
        >
          {lanes.map(({ speaker, segments: segs }) => (
            <div className="lane" key={speaker.label}>
              {segs.map((seg) => (
                <span
                  key={seg.id}
                  className="turn"
                  style={{
                    left: pct(seg.start),
                    width: `max(3px, ${pct(seg.end - seg.start)})`,
                    background: colors[speaker.label],
                  }}
                />
              ))}
            </div>
          ))}
          <div className="playhead" style={{ left: pct(currentTime) }} />
          <div className="ticks" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} style={{ left: pct(t) }}>
                {clock(t)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
