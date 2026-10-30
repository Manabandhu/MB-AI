/** Pure helpers for chat read state; tested by `frontend/test/chatReadState.test.mjs`. */

type ReadableMessage = { id: string; createdAt: string };
type CountedConversation = { id: string; unreadCount?: number | null };

/**
 * Id of the newest message that exists on the server, or undefined. Optimistic messages (`temp-` ids) are skipped:
 * the server cannot mark read up to a message it has not stored.
 */
export function latestServerMessageId(messages: readonly ReadableMessage[]): string | undefined {
  let latest: ReadableMessage | undefined;
  let latestTime = Number.NEGATIVE_INFINITY;
  for (const message of messages) {
    if (message.id.startsWith('temp-')) continue;
    const time = Date.parse(message.createdAt);
    if (!Number.isFinite(time)) continue;
    if (time >= latestTime) {
      latest = message;
      latestTime = time;
    }
  }
  return latest?.id;
}

/**
 * The cached conversation list with one conversation's unread count replaced by the count the server returned after a
 * successful mark-read. Other conversations and an unknown cache are left untouched.
 */
export function withUnreadCount<T extends CountedConversation>(
  conversations: readonly T[] | undefined,
  conversationId: string,
  unreadCount: number,
): T[] | undefined {
  if (!conversations) return undefined;
  return conversations.map((c) => (c.id === conversationId ? { ...c, unreadCount } : c));
}
