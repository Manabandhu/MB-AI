import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { persistentStorage } from '@/lib/persistentStorage';

/** Device-local bookmarks; no server save or synchronization is implied. */
export const useSavedJobsStore = create<{
  ids: string[];
  toggle: (id: string) => void;
}>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((saved) => saved !== id)
            : [...state.ids, id],
        })),
    }),
    { name: 'manabandhu-saved-jobs', storage: createJSONStorage(() => persistentStorage) },
  ),
);
