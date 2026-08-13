import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

import { env } from '@/lib/env';

const mobileStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

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

export const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: Platform.OS === 'web' ? globalThis.localStorage : mobileStorage,
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
