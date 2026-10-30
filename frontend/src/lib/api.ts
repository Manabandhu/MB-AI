import { ApiError, AuthError, createHttpClient, isLocalOrLanHost } from '@manabandhu/core';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

function withHost(configured: string, hostname: string): string {
  const u = new URL(configured);
  u.hostname = hostname;
  return u.toString().replace(/\/$/, '');
}

export function getResolvedApiUrl(): string {
  const configured = env.apiUrl;
  let configuredHost: string | null = null;
  try {
    configuredHost = new URL(configured).hostname;
  } catch {}

  // In a browser on another device (phone or tablet on the LAN), reach the dev API through the page's host.
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const currentHost = window.location.hostname;
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1' && configuredHost) {
      if (isLocalOrLanHost(configuredHost)) return withHost(configured, currentHost);
    }
  }

  // In native Expo Go or a dev build, use the Metro host; Android emulators reach the host machine via 10.0.2.2.
  if (Platform.OS !== 'web' && configuredHost) {
    const hostUri =
      Constants.expoConfig?.hostUri ??
      (Constants as unknown as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } })
        ?.manifest2?.extra?.expoClient?.hostUri;
    const metroHost = hostUri ? String(hostUri).split(':')[0] : '';
    if (metroHost && isLocalOrLanHost(configuredHost)) return withHost(configured, metroHost);
    if (
      Platform.OS === 'android' &&
      (configuredHost === 'localhost' || configuredHost === '127.0.0.1')
    ) {
      return withHost(configured, '10.0.2.2');
    }
  }

  return configured.replace(/\/$/, '');
}

export type ApiHealth = {
  service: string;
  status: string;
};

// Response helpers live in @manabandhu/core so every client surface parses errors the same way.
export { ApiError, AuthError, parseJson, parseJsonOrThrow } from '@manabandhu/core';

const http = createHttpClient({
  baseUrl: getResolvedApiUrl,
  getAccessToken: async () => (await supabase.auth.getSession()).data.session?.access_token ?? null,
});

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

/** Calls the ManaBandhu backend with the signed-in member's token. Every module's `api.ts` goes through this. */
export function apiFetch(path: string, init: RequestInit = {}) {
  return http.fetch(path, init);
}
