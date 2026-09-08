import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';

export async function getAssistantMessages(): Promise<AssistantMessage[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/assistant/messages'), 'Assistant messages');
}

export async function sendAssistantMessage(body: {
  content: string;
  conversationId?: string;
}): Promise<AssistantMessage> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/assistant/messages', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    'SendMessage',
  );
}

export async function getAssistantHistory(): Promise<AssistantConversation[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/assistant/history'), 'Assistant history');
}

export async function getAssistantCitations(): Promise<AssistantCitation[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/assistant/citations'), 'Assistant citations');
}

export type AssistantMessage = {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  body?: string;
  createdAt: string;
  time?: string;
  sent?: boolean;
};

export type AssistantConversation = {
  id: string;
  userId?: string;
  title: string;
  body?: string;
  meta?: string;
  route?: string;
  createdAt: string;
  updatedAt: string;
};

export type AssistantCitation = {
  id: string;
  messageId: string;
  title: string;
  url: string;
  snippet: string;
  body?: string;
  meta?: string;
  source?: string;
  createdAt: string;
};
