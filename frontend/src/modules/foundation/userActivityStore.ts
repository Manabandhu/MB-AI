import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AppIconName } from '@/modules/shared/ui/AppIcon';

export interface ModuleItem {
  id: string;
  label: string;
  route: string;
  icon: AppIconName;
  bg: string;
  iconColor: string;
  category: 'living' | 'career' | 'community' | 'essentials' | 'safety';
  description: string;
}

export const ALL_APP_MODULES: ModuleItem[] = [
  {
    id: 'rooms',
    label: 'Rooms',
    route: '/rooms',
    icon: 'home',
    bg: '#dce8fe',
    iconColor: '#2b50aa',
    category: 'living',
    description: 'Zero-brokerage verified rooms, flatmates & student sublets',
  },
  {
    id: 'rides',
    label: 'Rides',
    route: '/rides',
    icon: 'car',
    bg: '#d9f5f5',
    iconColor: '#00696b',
    category: 'living',
    description: 'Carpools to tech campuses, airports & weekend grocery runs',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    route: '/expenses',
    icon: 'wallet',
    bg: '#e8e5f2',
    iconColor: '#431ebe',
    category: 'living',
    description: 'Flatmate Splitwise calculations, balances & Zelle settlement',
  },
  {
    id: 'community',
    label: 'Community',
    route: '/community',
    icon: 'community',
    bg: '#fce8f3',
    iconColor: '#b5198d',
    category: 'community',
    description: 'Local city forums, student advice & Q&A discussions',
  },
  {
    id: 'events',
    label: 'Events',
    route: '/events',
    icon: 'calendar',
    bg: '#fff4e0',
    iconColor: '#c97a00',
    category: 'community',
    description: 'Diwali melas, cultural festivals & tech mixers',
  },
  {
    id: 'chat',
    label: 'Chat',
    route: '/chat',
    icon: 'message',
    bg: '#e4ecff',
    iconColor: '#2a5be0',
    category: 'community',
    description: 'Direct messaging, room inquiries & carpool coordination',
  },
  {
    id: 'jobs',
    label: 'Jobs',
    route: '/jobs',
    icon: 'briefcase',
    bg: '#fff0e6',
    iconColor: '#ff7e33',
    category: 'career',
    description: 'Tech employee referrals with H-1B & OPT visa filters',
  },
  {
    id: 'referrals',
    label: 'Referrals',
    route: '/referrals',
    icon: 'verified-user',
    bg: '#e2f9ef',
    iconColor: '#1a8a5c',
    category: 'career',
    description: 'Community skill exchange, freelancers & trusted services',
  },
  {
    id: 'marketplace',
    label: 'Market',
    route: '/marketplace',
    icon: 'marketplace',
    bg: '#e2f9ef',
    iconColor: '#1a8a5c',
    category: 'essentials',
    description: 'Buy & sell Indian cookware, study desks & electronics',
  },
  {
    id: 'utilities',
    label: 'Utilities',
    route: '/utilities',
    icon: 'package',
    bg: '#e0f5f5',
    iconColor: '#00696b',
    category: 'essentials',
    description: 'Tiffin subscriptions, Patel Bros carpools & Texas electricity',
  },
  {
    id: 'immigration',
    label: 'Visas',
    route: '/immigration',
    icon: 'book',
    bg: '#ede9fe',
    iconColor: '#6d28d9',
    category: 'essentials',
    description: 'Live USCIS Visa Bulletin ticker, OPT guides & attorney Q&A',
  },
  {
    id: 'safety',
    label: 'Safety',
    route: '/safety',
    icon: 'shield',
    bg: '#ffeaea',
    iconColor: '#ba1a1a',
    category: 'safety',
    description: 'Emergency 911 / 988, trusted ride contacts & incident reports',
  },
];

// Default starter modules for brand new users
const DEFAULT_TOP_MODULE_IDS = ['rooms', 'community', 'rides', 'jobs', 'marketplace', 'events', 'expenses', 'utilities'];

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

interface UserActivityState {
  frequencyMap: Record<string, number>;
  recentVisits: { moduleId: string; timestamp: number }[];
  recordModuleVisit: (moduleId: string) => void;
  getDynamicModules: (limit?: number) => ModuleItem[];
  resetActivity: () => void;
}

export const useUserActivityStore = create<UserActivityState>()(
  persist(
    (set, get) => ({
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

      getDynamicModules: (limit = 8): ModuleItem[] => {
        const { frequencyMap, recentVisits } = get();

        // Score each module: frequency * 3 + recency bonus + starter default priority
        const scoredModules = ALL_APP_MODULES.map((m) => {
          const freq = frequencyMap[m.id] ?? 0;
          const recentIndex = recentVisits.findIndex((v) => v.moduleId === m.id);
          const recencyScore = recentIndex >= 0 ? Math.max(0, 10 - recentIndex) : 0;
          const defaultIndex = DEFAULT_TOP_MODULE_IDS.indexOf(m.id);
          const defaultScore = defaultIndex >= 0 ? 8 - defaultIndex : 0;

          const totalScore = freq * 3 + recencyScore * 2 + defaultScore;
          return { module: m, score: totalScore, freq, recentIndex };
        });

        scoredModules.sort((a, b) => b.score - a.score);
        return scoredModules.slice(0, limit).map((sm) => sm.module);
      },

      resetActivity: () => {
        set({ frequencyMap: {}, recentVisits: [] });
      },
    }),
    {
      name: 'manabandhu-user-activity',
      storage: createJSONStorage(() => universalStorage),
    }
  )
);
