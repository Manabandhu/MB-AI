import { apiFetch, parseJson, parseJsonOrThrow } from '@/lib/apiClient';

export type Conversation = {
  id: string;
  type: 'DIRECT' | 'GROUP' | 'ROOM_INQUIRY' | 'RIDE_TEMP';
  title?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  /** Messages from others after the caller's read marker; null for an admin who is not a member. */
  unreadCount?: number | null;
  participants?: Participant[];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  messageType: 'TEXT' | 'IMAGE' | 'SYSTEM';
  createdAt: string;
  sent?: boolean;
};

export type Participant = {
  id: string;
  conversationId: string;
  userId: string;
  name?: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
};

export async function listConversations(): Promise<Conversation[]> {
  return parseJson(await apiFetch('/api/v1/chat/conversations'));
}

export async function getConversation(id: string): Promise<Conversation> {
  return parseJson(await apiFetch(`/api/v1/chat/conversations/${encodeURIComponent(id)}`));
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  return parseJson(
    await apiFetch(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/messages`),
  );
}

export async function sendMessage(
  conversationId: string,
  body: string,
  messageType: 'TEXT' | 'IMAGE' | 'SYSTEM' = 'TEXT',
): Promise<Message> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body, messageType }),
    }),
    'SendMessage',
  );
}

export type ConversationReadState = {
  conversationId: string;
  lastReadAt: string;
  unreadCount: number;
};

/**
 * Moves the caller's read marker up to `messageId` (or to now without one). The server never moves it backwards.
 * Throws on any non-2xx so callers only clear unread state after the server accepted it.
 */
export async function markConversationRead(
  conversationId: string,
  messageId?: string,
): Promise<ConversationReadState> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/read`, {
      method: 'POST',
      body: JSON.stringify(messageId ? { messageId } : {}),
    }),
    'MarkConversationRead',
  );
}

export async function getParticipants(conversationId: string): Promise<Participant[]> {
  return parseJson(
    await apiFetch(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/participants`),
  );
}
