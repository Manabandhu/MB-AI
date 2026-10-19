import type { Speaker } from "../types";

// Color means one thing in this app: who is speaking. You are always the first hue.
const OWNER = "var(--voice-owner)";
const OTHERS = ["var(--voice-1)", "var(--voice-2)", "var(--voice-3)", "var(--voice-4)", "var(--voice-5)"];

export function speakerColors(speakers: Speaker[]): Record<string, string> {
  const map: Record<string, string> = {};
  let i = 0;
  for (const s of speakers) {
    map[s.label] = s.is_owner ? OWNER : OTHERS[i++ % OTHERS.length];
  }
  return map;
}

export function speakerNames(speakers: Speaker[]): Record<string, string> {
  return Object.fromEntries(speakers.map((s) => [s.label, s.display_name]));
}

/** Map a display name used in the summary back to a color. */
export function colorForName(name: string, speakers: Speaker[], colors: Record<string, string>): string | undefined {
  const s = speakers.find((x) => x.display_name.toLowerCase() === name.toLowerCase());
  return s ? colors[s.label] : undefined;
}
