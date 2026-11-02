import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { persistentStorage } from '@/lib/persistentStorage';
import { saveRoom as apiSaveRoom, unsaveRoom as apiUnsaveRoom } from '../api';

/**
 * Optimistic cache of save/unsave choices, keyed to the signed-in user. The server (`savedByViewer`, `/favorites`)
 * stays the source of truth: entries here only override it while a request is in flight or until the next refetch,
 * and the whole cache is dropped on sign-out (`clearSavedRooms`) or when a different user is seen.
 */
interface SavedRoomsState {
  userId: string | null;
  /** roomId → saved (true) / unsaved (false). Missing means "use the server value". */
  overrides: Record<string, boolean>;
  /** Saves or unsaves on the server; rolls back and rethrows when the request fails. */
  setSaved: (userId: string, roomId: string, saved: boolean) => Promise<void>;
  /** Drops one override once the server data reflects it. */
  forget: (roomId: string) => void;
  clear: () => void;
}

export const useSavedRoomsStore = create<SavedRoomsState>()(
  persist(
    (set, get) => ({
      userId: null,
      overrides: {},

      setSaved: async (userId, roomId, saved) => {
        const sameUser = get().userId === userId;
        const previous = sameUser ? get().overrides[roomId] : undefined;
        set((state) => ({
          userId,
          overrides: { ...(sameUser ? state.overrides : {}), [roomId]: saved },
        }));
        try {
          if (saved) await apiSaveRoom(roomId);
          else await apiUnsaveRoom(roomId);
        } catch (error) {
          set((state) => {
            if (state.userId !== userId) return state;
            const next = { ...state.overrides };
            if (previous === undefined) delete next[roomId];
            else next[roomId] = previous;
            return { overrides: next };
          });
          throw error;
        }
      },

      forget: (roomId) =>
        set((state) => {
          if (!(roomId in state.overrides)) return state;
          const next = { ...state.overrides };
          delete next[roomId];
          return { overrides: next };
        }),

      clear: () => set({ userId: null, overrides: {} }),
    }),
    {
      name: 'manabandhu-saved-rooms-v2',
      storage: createJSONStorage(() => persistentStorage),
    },
  ),
);

/** Drops every cached save choice. Called by `authStore.signOut` so the next user never sees them. */
export function clearSavedRooms() {
  useSavedRoomsStore.getState().clear();
}
