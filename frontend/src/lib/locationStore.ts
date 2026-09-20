import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  ALL_USA_CITY,
  detectCurrentLocation,
  getNearbyUSCities,
  type NearbyCityResult,
  type SearchCityResult,
} from '@/modules/rooms/utils/locationService';

export type AppLocation = SearchCityResult;
export type { NearbyCityResult };

export const ALL_USA_LOCATION: AppLocation = ALL_USA_CITY;
export const DEFAULT_LOCATION: AppLocation = ALL_USA_LOCATION;

export const POPULAR_CITIES: AppLocation[] = [ALL_USA_LOCATION];
export const POPULAR_METROS = POPULAR_CITIES;

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
  detectedLocation: AppLocation | null;
  nearbyCities: NearbyCityResult[];
  isDetecting: boolean;
  setLocation: (location: AppLocation) => void;
  detectDeviceLocation: () => Promise<AppLocation | null>;
  resetLocation: () => void;
}

export const useLocationStore = create<LocationStoreState>()(
  persist(
    (set) => ({
      currentLocation: DEFAULT_LOCATION,
      detectedLocation: null,
      nearbyCities: [],
      isDetecting: false,
      setLocation: (location: AppLocation) => {
        const nearby =
          location.id === ALL_USA_LOCATION.id
            ? []
            : getNearbyUSCities(location.latitude, location.longitude, 5);
        set({
          currentLocation: location,
          nearbyCities: nearby,
        });
      },
      detectDeviceLocation: async () => {
        set({ isDetecting: true });
        try {
          const detected = await detectCurrentLocation();
          if (detected) {
            const nearby = getNearbyUSCities(detected.latitude, detected.longitude, 5);
            set({
              detectedLocation: detected,
              currentLocation: detected,
              nearbyCities: nearby,
              isDetecting: false,
            });
            return detected;
          }
          set({ isDetecting: false });
          return null;
        } catch {
          set({ isDetecting: false });
          return null;
        }
      },
      resetLocation: () =>
        set({
          currentLocation: DEFAULT_LOCATION,
          nearbyCities: [],
        }),
    }),
    {
      name: 'manabandhu_active_location_v3',
      storage: createJSONStorage(() => universalStorage),
    },
  ),
);
