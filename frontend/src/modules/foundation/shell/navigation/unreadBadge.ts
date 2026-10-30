/** Pure helpers for the tab-bar unread badge; tested by `frontend/test/unreadBadge.test.mjs`. */

/** Sum of `unreadCount` over conversations; missing or invalid counts add nothing. */
export function totalUnread(conversations: readonly { unreadCount?: number | null }[]): number {
  let total = 0;
  for (const conversation of conversations) {
    const count = conversation.unreadCount;
    if (typeof count === 'number' && Number.isFinite(count) && count > 0)
      total += Math.floor(count);
  }
  return total;
}

/** Badge text: nothing for zero or unknown, the number up to 99, then "99+". */
export function badgeText(count: number | undefined): string | null {
  if (count === undefined || !Number.isFinite(count) || count <= 0) return null;
  return count > 99 ? '99+' : String(Math.floor(count));
}
