import { GraphQLClient } from 'graphql-request';

import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

export type ApiHealth = {
  service: string;
  status: string;
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
