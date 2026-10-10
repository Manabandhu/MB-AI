import type { MotionPreference } from '@manabandhu/design-system';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { persistentStorage } from '@/lib/persistentStorage';
import type { ThemePreference } from './preferences';

type AppearanceState = {
  theme: ThemePreference;
  motion: MotionPreference;
  setTheme: (theme: ThemePreference) => void;
  setMotion: (motion: MotionPreference) => void;
};

/** Device-local appearance choices (Settings → Appearance). Not synced to the backend. */
export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      theme: 'system',
      motion: 'full',
      setTheme: (theme) => set({ theme }),
      setMotion: (motion) => set({ motion }),
    }),
    {
      name: 'manabandhu-appearance',
      storage: createJSONStorage(() => persistentStorage),
    },
  ),
);
