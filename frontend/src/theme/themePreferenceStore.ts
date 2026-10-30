import type { MotionPreference } from '@manabandhu/design-system';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LanguagePreference } from '@/i18n';
import { persistentStorage } from '@/lib/persistentStorage';
import type { ThemePreference } from './preferences';

type AppearanceState = {
  theme: ThemePreference;
  motion: MotionPreference;
  language: LanguagePreference;
  /** The member chose "Not now" on the Home nickname prompt. */
  nicknamePromptDismissed: boolean;
  setTheme: (theme: ThemePreference) => void;
  setMotion: (motion: MotionPreference) => void;
  setLanguage: (language: LanguagePreference) => void;
  dismissNicknamePrompt: () => void;
};

/** Device-local appearance and language choices (Profile → Appearance). Not synced to the backend. */
export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      theme: 'system',
      motion: 'full',
      language: 'system',
      nicknamePromptDismissed: false,
      setTheme: (theme) => set({ theme }),
      setMotion: (motion) => set({ motion }),
      setLanguage: (language) => set({ language }),
      dismissNicknamePrompt: () => set({ nicknamePromptDismissed: true }),
    }),
    {
      name: 'manabandhu-appearance',
      storage: createJSONStorage(() => persistentStorage),
    },
  ),
);
