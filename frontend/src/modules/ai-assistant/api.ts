import { apiFetch } from '@/lib/api';

export async function getAssistantMessages() {
  const response = await apiFetch('/api/v1/assistant/messages');
  if (!response.ok) throw new Error(`Assistant messages failed: ${response.status}`);
  return response.json() as Promise<AssistantMessage[]>;
}

export async function sendAssistantMessage(body: { text: string }) {
  const response = await apiFetch('/api/v1/assistant/messages', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Send message failed: ${response.status}`);
  return response.json() as Promise<AssistantMessage>;
}

export async function getAssistantHistory() {
  const response = await apiFetch('/api/v1/assistant/history');
  if (!response.ok) throw new Error(`Assistant history failed: ${response.status}`);
  return response.json() as Promise<AssistantConversation[]>;
}

export async function getAssistantCitations() {
  const response = await apiFetch('/api/v1/assistant/citations');
  if (!response.ok) throw new Error(`Assistant citations failed: ${response.status}`);
  return response.json() as Promise<AssistantCitation[]>;
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
