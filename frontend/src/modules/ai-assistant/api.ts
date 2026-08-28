import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';

export async function getAssistantMessages(): Promise<AssistantMessage[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/assistant/messages'), 'Assistant messages');
}

export async function sendAssistantMessage(body: { text: string }): Promise<AssistantMessage> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/assistant/messages', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    'Send message',
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
  body: string;
  time: string;
  sent: boolean;
};

export type AssistantConversation = {
  id: string;
  title: string;
  body: string;
  meta: string;
  route: string;
};

export type AssistantCitation = {
  id: string;
  title: string;
  body: string;
  meta: string;
  source: string;
};
