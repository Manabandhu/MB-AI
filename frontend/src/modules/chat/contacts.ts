import { useQuery } from '@tanstack/react-query';
import { type Conversation, getParticipants, listConversations, type Participant } from './api';
import { contactsFromParticipants, type SharedConversation } from './chatFormat';

/** How many recent conversations are scanned for people; each costs one participants request. */
const CONTACT_SCAN_LIMIT = 20;

export type ChatContact = {
  userId: string;
  /** Display label: the participant's name when the server sends one, otherwise a short member tag. */
  label: string;
  /** Conversations you share, newest first. */
  sharedIn: SharedConversation[];
};

/**
 * People you already chat with, built from your conversations' participant lists. The app has no member search or
 * directory endpoint, so this is the only real source of other members' ids (used to start chats, add expense group
 * members, and pick who to report). Failures propagate so callers show an error, never an invented list.
 */
export async function listChatContacts(currentUserId: string | undefined): Promise<ChatContact[]> {
  const conversations = await listConversations();
  const recent = [...conversations]
    .sort((a, b) => Date.parse(b.lastMessageAt ?? '') - Date.parse(a.lastMessageAt ?? '') || 0)
    .slice(0, CONTACT_SCAN_LIMIT);
  const lists = await Promise.all(
    recent.map(async (c: Conversation) => ({
      conversation: c,
      participants: (await getParticipants(c.id)) as Participant[],
    })),
  );
  return contactsFromParticipants(lists, currentUserId);
}

export function useChatContacts(currentUserId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['chat', 'contacts', currentUserId],
    queryFn: () => listChatContacts(currentUserId),
    enabled: enabled && Boolean(currentUserId),
  });
}
