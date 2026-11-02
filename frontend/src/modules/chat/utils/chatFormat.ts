/** Pure chat display helpers; tested by `frontend/test/chatFormat.test.mjs`. No React or path aliases here. */

type ConversationType = 'DIRECT' | 'GROUP' | 'ROOM_INQUIRY' | 'RIDE_TEMP' | string;
type ParticipantLike = { userId: string; name?: string | null; role?: string | null };
type ConversationLike = { id: string; title?: string | null; type?: ConversationType };

/** Short, stable label for a member until the app has a profile directory; never an invented name. */
export function participantLabel(
  participant: ParticipantLike,
  currentUserId: string | undefined,
): string {
  if (currentUserId && participant.userId === currentUserId) return 'You';
  const name = participant.name?.trim();
  if (name) return name;
  return `Member ${participant.userId.slice(0, 4).toUpperCase()}`;
}

/** Human label for a conversation type; compared case-insensitively. */
export function conversationTypeLabel(type: ConversationType | null | undefined): string {
  switch (String(type ?? '').toUpperCase()) {
    case 'GROUP':
      return 'Group chat';
    case 'ROOM_INQUIRY':
      return 'Room inquiry';
    case 'RIDE_TEMP':
      return 'Ride chat';
    case 'DIRECT':
      return 'Direct message';
    default:
      return 'Conversation';
  }
}

/** The conversation's title, or its type label when it has none. */
export function conversationTitle(conversation: ConversationLike | null | undefined): string {
  const title = conversation?.title?.trim();
  return title || conversationTypeLabel(conversation?.type);
}

/** "Owner" / "Member" for a participant role, case-insensitively. */
export function roleLabel(role: string | null | undefined): string {
  return String(role ?? '').toUpperCase() === 'OWNER' ? 'Owner' : 'Member';
}

/** True only for absolute http(s) URLs, the only image bodies the chat renders as pictures. */
export function isHttpUrl(value: string | null | undefined): boolean {
  return /^https?:\/\/\S+$/i.test(String(value ?? '').trim());
}

/** A conversation you share with a contact. */
export type SharedConversation = { id: string; title: string; type: string };

/**
 * Distinct people (other than the caller) across conversations, each with the conversations you share.
 * Order follows the conversations' order, so pass them newest first.
 */
export function contactsFromParticipants(
  lists: readonly { conversation: ConversationLike; participants: readonly ParticipantLike[] }[],
  currentUserId: string | undefined,
): { userId: string; label: string; sharedIn: SharedConversation[] }[] {
  const byId = new Map<string, { userId: string; label: string; sharedIn: SharedConversation[] }>();
  for (const { conversation, participants } of lists) {
    const shared: SharedConversation = {
      id: conversation.id,
      title: conversationTitle(conversation),
      type: String(conversation.type ?? '').toUpperCase(),
    };
    for (const participant of participants) {
      if (!participant.userId || participant.userId === currentUserId) continue;
      const existing = byId.get(participant.userId);
      if (existing) {
        if (!existing.sharedIn.some((c) => c.id === shared.id)) existing.sharedIn.push(shared);
        continue;
      }
      byId.set(participant.userId, {
        userId: participant.userId,
        label: participantLabel(participant, currentUserId),
        sharedIn: [shared],
      });
    }
  }
  return [...byId.values()];
}

/**
 * Drops the oldest pending (sending or failed) message that `incoming` confirms: same sender as the caller and the
 * same text. Realtime can deliver the stored copy before the send request returns, or after a send that timed out on
 * the client but was saved; removing the pending copy keeps Retry from posting it twice.
 */
export function withoutDeliveredPending<T extends { body: string }>(
  pending: readonly T[],
  incoming: { senderId: string; body: string },
  currentUserId: string | undefined,
): T[] {
  if (!currentUserId || incoming.senderId !== currentUserId) return [...pending];
  const index = pending.findIndex((p) => p.body.trim() === incoming.body.trim());
  if (index < 0) return [...pending];
  return [...pending.slice(0, index), ...pending.slice(index + 1)];
}
