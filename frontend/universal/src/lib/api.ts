import { GraphQLClient } from 'graphql-request';

import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

export type ApiHealth = {
  service: string;
  status: string;
};

export type AutomationOperation = {
  id: string;
  label: string;
  description: string;
  category: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  requiresConfirmation: boolean;
  configured: boolean;
};

export type AutomationExecution = {
  executionId: string;
  operationId: string;
  status: string;
  environment: string;
  ref: string;
  requestedAt: string;
};

async function authorizationHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export async function getApiHealth(): Promise<ApiHealth> {
  const response = await fetch(`${env.apiUrl}/api/v1/health`);
  if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
  return response.json() as Promise<ApiHealth>;
}

export async function graphqlClient() {
  return new GraphQLClient(`${env.apiUrl}/graphql`, {
    headers: await authorizationHeaders(),
  });
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const auth = await authorizationHeaders();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  for (const [name, value] of Object.entries(auth)) headers.set(name, value);

  return fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers,
  });
}

async function responseJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  const detail = await response.text();
  throw new Error(detail || `Request failed: ${response.status}`);
}

export async function listAutomationOperations(): Promise<AutomationOperation[]> {
  return responseJson(await apiFetch('/api/v1/admin/automations'));
}

export async function executeAutomation(
  operationId: string,
  input: { environment: string; ref: string; reason: string; confirmed: boolean },
): Promise<AutomationExecution> {
  return responseJson(
    await apiFetch(`/api/v1/admin/automations/${encodeURIComponent(operationId)}/executions`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}
