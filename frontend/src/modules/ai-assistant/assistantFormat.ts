/** Pure assistant helpers; tested by `frontend/test/safetyUtilities.test.mjs`. No React or path aliases here. */

type TimedMessage = { id: string; createdAt: string };

/** Messages oldest first (the server already sends them that way; this keeps the order stable after merges). */
export function oldestFirst<T extends TimedMessage>(messages: readonly T[]): T[] {
  return [...messages].sort((a, b) => {
    const diff = Date.parse(a.createdAt) - Date.parse(b.createdAt);
    return Number.isFinite(diff) ? diff : 0;
  });
}

/** True when `role` is the member's own message, case-insensitively. */
export function isUserRole(role: string | null | undefined): boolean {
  return String(role ?? '').toUpperCase() === 'USER';
}

/** Only absolute http(s) links are opened from citations. */
export function safeExternalUrl(url: string | null | undefined): string | null {
  const value = String(url ?? '').trim();
  return /^https?:\/\/[^\s]+$/i.test(value) ? value : null;
}
