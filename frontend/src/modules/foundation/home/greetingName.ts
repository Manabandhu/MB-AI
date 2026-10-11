/** Longest name shown beside the greeting on one line of a phone header. Longer names trigger the nickname nudge. */
export const MAX_GREETING_NAME = 10;
export const NICKNAME_MIN = 2;
/** A saved nickname must always fit beside the greeting, otherwise the nudge would keep coming back. */
export const NICKNAME_MAX = MAX_GREETING_NAME;

type Metadata = { nickname?: unknown; full_name?: unknown } | null | undefined;

/** The nickname if set, otherwise the first word of the full name; `null` when there is nothing usable. */
export function preferredName(metadata: Metadata): string | null {
  const nickname = typeof metadata?.nickname === 'string' ? metadata.nickname.trim() : '';
  if (nickname) return nickname;
  const full = typeof metadata?.full_name === 'string' ? metadata.full_name.trim() : '';
  const first = full.split(/\s+/)[0] ?? '';
  return first || null;
}

/** Name to put next to the greeting, or `null` (greet without a name and offer to set a nickname). */
export function greetingName(metadata: Metadata): string | null {
  const name = preferredName(metadata);
  return name && [...name].length <= MAX_GREETING_NAME ? name : null;
}

/** Trims and validates a nickname; returns an error message key or the cleaned value. */
export function validateNickname(
  input: string,
): { ok: true; value: string } | { ok: false; error: 'tooShort' | 'tooLong' } {
  const value = input.trim().replace(/\s+/g, ' ');
  const length = [...value].length;
  if (length < NICKNAME_MIN) return { ok: false, error: 'tooShort' };
  if (length > NICKNAME_MAX) return { ok: false, error: 'tooLong' };
  return { ok: true, value };
}
