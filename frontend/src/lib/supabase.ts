import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

import { createChunkedStorage } from '@/lib/chunkedStorage';
import { env } from '@/lib/env';

// Supabase sessions exceed SecureStore's ~2 KB value limit, so they are stored in chunks.
export const chunkedSecureStorage = createChunkedStorage(SecureStore);

function ensureStaticRenderWebSocket() {
  const target = globalThis as typeof globalThis & { WebSocket?: typeof WebSocket };
  if (target.WebSocket) return;

  class StaticRenderWebSocket extends EventTarget {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    readonly binaryType = 'blob';
    readonly bufferedAmount = 0;
    readonly extensions = '';
    readonly protocol = '';
    readonly readyState = StaticRenderWebSocket.CLOSED;
    readonly url: string;

    constructor(url: string | URL) {
      super();
      this.url = String(url);
    }

    close() {}
    send() {}
  }

  target.WebSocket = StaticRenderWebSocket as unknown as typeof WebSocket;
}

ensureStaticRenderWebSocket();

const memoryStorageMap = new Map<string, string>();
const memoryStorage = {
  getItem: (key: string) => memoryStorageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memoryStorageMap.set(key, value);
  },
  removeItem: (key: string) => {
    memoryStorageMap.delete(key);
  },
};

const webStorage =
  typeof window !== 'undefined' && window.localStorage ? window.localStorage : memoryStorage;

export const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: Platform.OS === 'web' ? webStorage : chunkedSecureStorage,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
    persistSession: true,
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
