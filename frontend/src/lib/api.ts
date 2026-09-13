import Constants from 'expo-constants';
import { GraphQLClient } from 'graphql-request';
import { Platform } from 'react-native';

import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

export function getResolvedApiUrl(): string {
  const configured = env.apiUrl;
  // If in browser (e.g. mobile browser or desktop browser):
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const currentHost = window.location.hostname;
    if (currentHost && currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      try {
        const u = new URL(configured);
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
          u.hostname = currentHost;
          return u.toString().replace(/\/$/, '');
        }
      } catch {}
    }
  }

  // If in native React Native / Expo Go on a mobile device or emulator:
  if (Platform.OS !== 'web') {
    try {
      const u = new URL(configured);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        const hostUri = Constants.expoConfig?.hostUri;
        if (hostUri) {
          const metroHost = hostUri.split(':')[0];
          if (metroHost) {
            u.hostname = metroHost;
            return u.toString().replace(/\/$/, '');
          }
        }
        if (Platform.OS === 'android') {
          u.hostname = '10.0.2.2';
          return u.toString().replace(/\/$/, '');
        }
      }
    } catch {}
  }

  return configured.replace(/\/$/, '');
}

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
  const response = await fetch(`${getResolvedApiUrl()}/api/v1/health`);
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
  return new GraphQLClient(`${getResolvedApiUrl()}/graphql`, {
    headers: await authorizationHeaders(),
  });
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const auth = await authorizationHeaders();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  for (const [name, value] of Object.entries(auth)) headers.set(name, value);

  const response = await fetch(`${getResolvedApiUrl()}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    const text = await response.text().catch(() => '');
    throw new AuthError(text || `Authentication required (${response.status})`, response.status);
  }

  return response;
}
