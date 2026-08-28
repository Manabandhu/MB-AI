import { apiFetch, parseJson } from '@/lib/apiClient';

export type Conversation = {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  participants: Participant[];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  sent: boolean;
};

export type Participant = {
  id: string;
  name: string;
  avatar?: string;
  role: string;
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
  return parseJson(
    await apiFetch(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  );
}

export async function getParticipants(conversationId: string): Promise<Participant[]> {
  return parseJson(
    await apiFetch(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/participants`),
  );
}
