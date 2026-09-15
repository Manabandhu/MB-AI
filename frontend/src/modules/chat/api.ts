import { apiFetch, parseJson, parseJsonOrThrow } from '@/lib/apiClient';

export type Conversation = {
  id: string;
  type: 'DIRECT' | 'GROUP' | 'ROOM_INQUIRY' | 'RIDE_TEMP';
  title?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
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

export async function sendMessage(conversationId: string, body: string): Promise<Message> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body, messageType: 'TEXT' }),
    }),
    'SendMessage',
  );
}

export async function getParticipants(conversationId: string): Promise<Participant[]> {
  return parseJson(
    await apiFetch(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/participants`),
  );
}

export async function createConversation(input: {
  type: 'DIRECT' | 'GROUP';
  title?: string;
  participantIds: string[];
}): Promise<Conversation> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'CreateConversation',
  );
}
