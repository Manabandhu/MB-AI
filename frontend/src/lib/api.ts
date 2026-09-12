import { GraphQLClient } from 'graphql-request';

import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

export type ApiHealth = {
  service: string;
  status: string;
};

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function authorizationHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export async function getApiHealth(): Promise<ApiHealth> {
  const response = await fetch(`${env.apiUrl}/api/v1/health`);
  if (!response.ok) throw new ApiError(`Health check failed: ${response.status}`, response.status);
  return response.json() as Promise<ApiHealth>;
}

export async function getIdentity(): Promise<IdentityResponse> {
  const response = await apiFetch('/api/v1/me');
  if (!response.ok) {
    throw new AuthError(`Identity fetch failed: ${response.status}`, response.status);
  }
  return response.json() as Promise<IdentityResponse>;
}

export interface IdentityResponse {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string;
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

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    const text = await response.text().catch(() => '');
    throw new AuthError(text || `Authentication required (${response.status})`, response.status);
  }

  return response;
}
