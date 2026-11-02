import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { persistentStorage } from '@/lib/persistentStorage';
import {
  ALL_USA_CITY,
  detectCurrentLocation,
  getNearbyUSCities,
  type NearbyCityResult,
  type SearchCityResult,
} from '@/modules/shared/utils/location/locationService';

export type AppLocation = SearchCityResult;
export type { NearbyCityResult };

export const ALL_USA_LOCATION: AppLocation = ALL_USA_CITY;
export const DEFAULT_LOCATION: AppLocation = ALL_USA_LOCATION;

export const POPULAR_CITIES: AppLocation[] = [ALL_USA_LOCATION];
export const POPULAR_METROS = POPULAR_CITIES;

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
      storage: createJSONStorage(() => persistentStorage),
    },
  ),
);
