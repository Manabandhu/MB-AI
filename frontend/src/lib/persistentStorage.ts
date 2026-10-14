import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

const memoryStore = new Map<string, string>();

function webStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

/**
 * One key-value adapter for persisted Zustand stores: localStorage on web, SecureStore on native, and an in-memory
 * map when neither is available (private browsing, SSR, tests).
 */
export const persistentStorage: StateStorage = {
  getItem: async (name) => {
    if (Platform.OS === 'web') return webStorage()?.getItem(name) ?? memoryStore.get(name) ?? null;
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return memoryStore.get(name) ?? null;
    }
  },
  setItem: async (name, value) => {
    if (Platform.OS === 'web') {
      const storage = webStorage();
      if (storage) storage.setItem(name, value);
      else memoryStore.set(name, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {
      memoryStore.set(name, value);
    }
  },
  removeItem: async (name) => {
    if (Platform.OS === 'web') {
      const storage = webStorage();
      if (storage) storage.removeItem(name);
      else memoryStore.delete(name);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      memoryStore.delete(name);
    }
  },
};
