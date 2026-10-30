/** Device-local record of which modules this member opens, used only to order launcher tiles. */
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { persistentStorage } from '@/lib/persistentStorage';
import { type LauncherModule, launcherModules } from '../launcher/moduleRegistry';
import { rankModules, type Visit } from '../launcher/rankModules';

interface UserActivityState {
  frequencyMap: Record<string, number>;
  recentVisits: Visit[];
  recordModuleVisit: (moduleId: string) => void;
  resetActivity: () => void;
}

export const useUserActivityStore = create<UserActivityState>()(
  persist(
    (set) => ({
      frequencyMap: {},
      recentVisits: [],

      recordModuleVisit: (moduleId: string) => {
        set((state) => {
          const now = Date.now();
          const newFreq = {
            ...state.frequencyMap,
            [moduleId]: (state.frequencyMap[moduleId] ?? 0) + 1,
          };
          const filteredRecent = state.recentVisits.filter((v) => v.moduleId !== moduleId);
          const newRecent = [{ moduleId, timestamp: now }, ...filteredRecent].slice(0, 20);

          return {
            frequencyMap: newFreq,
            recentVisits: newRecent,
          };
        });
      },

      resetActivity: () => {
        set({ frequencyMap: {}, recentVisits: [] });
      },
    }),
    {
      name: 'manabandhu-user-activity',
      storage: createJSONStorage(() => persistentStorage),
    },
  ),
);

/** Launcher modules ordered for this member (device-local visit history; never sent to the server). */
export function useRankedModules(limit = launcherModules.length): LauncherModule[] {
  const frequencyMap = useUserActivityStore((s) => s.frequencyMap);
  const recentVisits = useUserActivityStore((s) => s.recentVisits);
  return useMemo(
    () => rankModules(launcherModules, frequencyMap, recentVisits, limit),
    [frequencyMap, recentVisits, limit],
  );
}
