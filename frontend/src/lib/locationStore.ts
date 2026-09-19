import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SearchCityResult } from '@/modules/rooms/utils/locationService';

export type AppLocation = SearchCityResult;

export const POPULAR_METROS: AppLocation[] = [
  {
    id: 'austin-tx',
    name: 'Austin, TX',
    cityName: 'Austin',
    stateCode: 'TX',
    latitude: 30.2672,
    longitude: -97.7431,
  },
  {
    id: 'dallas-tx',
    name: 'Dallas-Fort Worth, TX',
    cityName: 'Dallas',
    stateCode: 'TX',
    latitude: 32.7767,
    longitude: -96.797,
  },
  {
    id: 'houston-tx',
    name: 'Houston, TX',
    cityName: 'Houston',
    stateCode: 'TX',
    latitude: 29.7604,
    longitude: -95.3698,
  },
  {
    id: 'san-jose-ca',
    name: 'San Jose / Bay Area, CA',
    cityName: 'San Jose',
    stateCode: 'CA',
    latitude: 37.3382,
    longitude: -121.8863,
  },
  {
    id: 'seattle-wa',
    name: 'Seattle, WA',
    cityName: 'Seattle',
    stateCode: 'WA',
    latitude: 47.6062,
    longitude: -122.3321,
  },
  {
    id: 'chicago-il',
    name: 'Chicago, IL',
    cityName: 'Chicago',
    stateCode: 'IL',
    latitude: 41.8781,
    longitude: -87.6298,
  },
  {
    id: 'new-york-ny',
    name: 'New York, NY',
    cityName: 'New York',
    stateCode: 'NY',
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    id: 'atlanta-ga',
    name: 'Atlanta, GA',
    cityName: 'Atlanta',
    stateCode: 'GA',
    latitude: 33.749,
    longitude: -84.388,
  },
  {
    id: 'columbus-oh',
    name: 'Columbus, OH',
    cityName: 'Columbus',
    stateCode: 'OH',
    latitude: 40.0992,
    longitude: -83.1141,
  },
  {
    id: 'all-usa',
    name: 'All Cities (USA)',
    cityName: 'All Cities',
    stateCode: 'USA',
    latitude: 39.8283,
    longitude: -98.5795,
  },
];

export const DEFAULT_LOCATION: AppLocation = POPULAR_METROS[0];

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

interface LocationStoreState {
  currentLocation: AppLocation;
  setLocation: (location: AppLocation) => void;
  resetLocation: () => void;
}

export const useLocationStore = create<LocationStoreState>()(
  persist(
    (set) => ({
      currentLocation: DEFAULT_LOCATION,
      setLocation: (location: AppLocation) => set({ currentLocation: location }),
      resetLocation: () => set({ currentLocation: DEFAULT_LOCATION }),
    }),
    {
      name: 'manabandhu_active_location_v1',
      storage: createJSONStorage(() => universalStorage),
    },
  ),
);
