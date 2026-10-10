import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { persistentStorage } from '@/lib/persistentStorage';

export type MapProvider = 'google' | 'apple';

interface MapPreferencesState {
  provider: MapProvider;
  setProvider: (provider: MapProvider) => void;
}

export const useMapPreferencesStore = create<MapPreferencesState>()(
  persist(
    (set) => ({
      provider: 'google', // Default to Google Maps
      setProvider: (provider: MapProvider) => set({ provider }),
    }),
    {
      name: 'mb_map_preferences',
      storage: createJSONStorage(() => persistentStorage),
    },
  ),
);
