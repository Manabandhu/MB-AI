import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { saveRoom as apiSaveRoom, unsaveRoom as apiUnsaveRoom } from './api';
import type { RoomListing } from './types';

const memoryStore = new Map<string, string>();

const universalStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(name);
      }
      return memoryStore.get(name) ?? null;
    }
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return memoryStore.get(name) ?? null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(name, value);
        return;
      }
      memoryStore.set(name, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {
      memoryStore.set(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(name);
        return;
      }
      memoryStore.delete(name);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      memoryStore.delete(name);
    }
  },
};

interface SavedRoomsState {
  savedRooms: Record<string, RoomListing>;
  isSaved: (roomId: string) => boolean;
  toggleSave: (room: RoomListing) => Promise<boolean>;
  removeSaved: (roomId: string) => Promise<void>;
  setFavoritesFromBackend: (rooms: RoomListing[]) => void;
  getSavedList: () => RoomListing[];
}

export const useSavedRoomsStore = create<SavedRoomsState>()(
  persist(
    (set, get) => ({
      savedRooms: {},

      isSaved: (roomId: string) => {
        return Boolean(get().savedRooms[roomId]);
      },

      toggleSave: async (room: RoomListing) => {
        const currentlySaved = Boolean(get().savedRooms[room.id]);

        if (currentlySaved) {
          // Optimistically remove from store
          set((state) => {
            const next = { ...state.savedRooms };
            delete next[room.id];
            return { savedRooms: next };
          });

          // Sync with backend (non-blocking)
          try {
            await apiUnsaveRoom(room.id);
          } catch {
            // Silently handled for offline/guest mode
          }

          return false;
        }

        // Optimistically add to store
        set((state) => ({
          savedRooms: {
            ...state.savedRooms,
            [room.id]: room,
          },
        }));

        // Sync with backend (non-blocking)
        try {
          await apiSaveRoom(room.id);
        } catch {
          // Silently handled for offline/guest mode
        }

        return true;
      },

      removeSaved: async (roomId: string) => {
        set((state) => {
          const next = { ...state.savedRooms };
          delete next[roomId];
          return { savedRooms: next };
        });

        try {
          await apiUnsaveRoom(roomId);
        } catch {
          // Silently handled
        }
      },

      setFavoritesFromBackend: (backendRooms: RoomListing[]) => {
        set((state) => {
          const merged = { ...state.savedRooms };
          for (const room of backendRooms) {
            merged[room.id] = room;
          }
          return { savedRooms: merged };
        });
      },

      getSavedList: () => {
        return Object.values(get().savedRooms);
      },
    }),
    {
      name: 'manabandhu-saved-rooms-v1',
      storage: createJSONStorage(() => universalStorage),
    },
  ),
);
