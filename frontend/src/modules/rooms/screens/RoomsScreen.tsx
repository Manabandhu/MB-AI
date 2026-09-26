import { color as baseColors, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { Href } from 'expo-router';
import { Link, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ALL_USA_LOCATION, useLocationStore } from '@/lib/locationStore';
import { listRoomListings } from '@/modules/rooms/api';
import { RoomMapCarousel } from '@/modules/rooms/components/RoomMapCarousel';
import { useSavedRoomsStore } from '@/modules/rooms/savedRoomsStore';
import type { RoomListing } from '@/modules/rooms/types';
import { searchAllUSCities } from '@/modules/rooms/utils/locationService';
import { UniversalMapView } from '@/modules/shared/components/UniversalMapView';
import { useMapPreferencesStore } from '@/modules/shared/stores/mapPreferencesStore';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import type { Coordinate } from '@/modules/shared/utils/geoPolygon';
import { isPointInPolygon } from '@/modules/shared/utils/geoPolygon';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const colors = {
  ...baseColors,
  appPrimary: '#431ebe',
  primaryContainer: '#5b3fd6',
  surfaceContainer: '#eaedff',
  surfaceContainerLow: '#f2f3ff',
  warm: '#ff7e33',
  teal: '#00696b',
  tealSoft: 'rgba(0,105,107,0.08)',
  indigoSoft: 'rgba(67,30,190,0.07)',
  orangeSoft: 'rgba(255,126,51,0.10)',
};

export type RoomsScreenId =
  | 'home'
  | 'search'
  | 'map'
  | 'filters'
  | 'saved'
  | 'my-listings'
  | 'create-listing'
  | 'details'
  | 'edit';

type RoomsScreenProps = {
  screenId: RoomsScreenId;
};

// ─── City Options ─────────────────────────────────────────────────────────────
type CityOption = {
  id: string;
  name: string;
  landmarks?: string[];
  latitude?: number;
  longitude?: number;
};

type ExtendedRoom = RoomListing & {
  mapX: number; // percentage across map
  mapY: number; // percentage down map
  verifiedHost: boolean;
};

export function matchesRoomLocation(
  room: ExtendedRoom,
  selectedCity: CityOption,
  globalLocation: { name: string; cityName?: string; stateCode?: string },
): boolean {
  if (
    !globalLocation.name ||
    selectedCity.id === 'all' ||
    selectedCity.id === 'all-usa' ||
    selectedCity.name.toLowerCase().includes('all cities')
  ) {
    return true;
  }

  const selCityLower = (globalLocation.cityName || selectedCity.name.split(',')[0] || '')
    .toLowerCase()
    .trim();
  const selStateUpper = (globalLocation.stateCode || selectedCity.name.split(',')[1] || '')
    .toUpperCase()
    .trim();
  const roomLocLower = (room.broadLocation ?? '').toLowerCase();
  const roomTitleLower = room.title.toLowerCase();
  const roomStateUpper = (room.stateCode ?? '').toUpperCase().trim();

  // 1. State match: If state is specified and room has a stateCode, ensure state matches
  if (selStateUpper && roomStateUpper && selStateUpper !== 'ALL' && selStateUpper !== 'US') {
    const isMultiStateMetro =
      selectedCity.id === 'jersey' ||
      selectedCity.name.includes('NYC') ||
      selectedCity.name.includes('NY') ||
      selectedCity.name.includes('NJ');

    if (isMultiStateMetro) {
      if (roomStateUpper !== 'NY' && roomStateUpper !== 'NJ') return false;
    } else if (roomStateUpper !== selStateUpper) {
      return false;
    }
  }

  // 2. Direct exact city name match (e.g. "Frisco" in "Main St & Teel Pkwy, Frisco, TX")
  if (
    selCityLower.length > 2 &&
    (roomLocLower.includes(selCityLower) || roomTitleLower.includes(selCityLower))
  ) {
    return true;
  }

  // 3. City landmarks match (if provided) - NEVER match 2-letter state codes
  const candidateLandmarks = selectedCity.landmarks ?? [];
  const validLandmarks = candidateLandmarks.filter(
    (lm) => lm && lm.trim().length > 2 && lm.trim().toUpperCase() !== selStateUpper,
  );

  if (validLandmarks.length > 0) {
    const matchesLandmark = validLandmarks.some((lm) => {
      const lmLower = lm.toLowerCase().trim();
      return roomLocLower.includes(lmLower) || roomTitleLower.includes(lmLower);
    });
    if (matchesLandmark) return true;
  }

  // 4. Coordinate proximity match: for every city, match nearby listings within ~14 miles (0.20°)
  if (selectedCity.latitude && selectedCity.longitude && room.latitude && room.longitude) {
    const dLat = Math.abs(selectedCity.latitude - room.latitude);
    const dLng = Math.abs(selectedCity.longitude - room.longitude);
    if (dLat <= 0.2 && dLng <= 0.2) {
      return true;
    }
    // If coordinates are known and beyond range (e.g. Austin vs Frisco/Coppell is 200mi / 2.88°), reject
    return false;
  }

  // 5. Fallback for listings without coordinates: token match
  const cityTokens = selCityLower
    .split(/[\s\-/,+]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && t !== 'area' && t !== 'metro');

  if (cityTokens.some((tok) => roomLocLower.includes(tok) || roomTitleLower.includes(tok))) {
    return true;
  }

  return false;
}

const filterCategories = [
  { id: 'all', label: 'All' },
  { id: 'veg', label: 'Pure Veg Only' },
  { id: 'bath', label: 'Private Bath' },
  { id: 'female', label: 'Female Only' },
  { id: 'under800', label: 'Under $800' },
  { id: 'furnished', label: 'Furnished' },
];

type SortOption = 'recommended' | 'price_low' | 'price_high' | 'newest';

const SORT_OPTIONS: { id: SortOption; label: string; icon: string; description: string }[] = [
  {
    id: 'recommended',
    label: 'Recommended',
    icon: '✦',
    description: 'Best balance of reviews, verified hosts, and relevance',
  },
  {
    id: 'price_low',
    label: 'Price: Low to High',
    icon: '↑',
    description: 'Most affordable rent and shared rooms first',
  },
  {
    id: 'price_high',
    label: 'Price: High to Low',
    icon: '↓',
    description: 'Master bedrooms and luxury suites first',
  },
  {
    id: 'newest',
    label: 'Newest First',
    icon: '⚡',
    description: 'Freshly posted rooms and recent updates',
  },
];

export function RoomsScreen({ screenId }: RoomsScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isDualPane = width >= 1024;
  const insets = useSafeAreaInsets();

  // State (Global Location sync)
  const globalLocation = useLocationStore((s) => s.currentLocation);
  const setGlobalLocation = useLocationStore((s) => s.setLocation);
  const mapProvider = useMapPreferencesStore((s) => s.provider);
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  const isAppleMapsActive = (Platform.OS === 'ios' && isExpoGo) || mapProvider === 'apple';

  const detectedLocation = useLocationStore((s) => s.detectedLocation);
  const nearbyCities = useLocationStore((s) => s.nearbyCities);
  const isDetecting = useLocationStore((s) => s.isDetecting);
  const detectDeviceLocation = useLocationStore((s) => s.detectDeviceLocation);

  // Auto-detect device location on initial load if not yet detected
  useEffect(() => {
    if (!detectedLocation) {
      detectDeviceLocation();
    }
  }, [detectedLocation, detectDeviceLocation]);

  const selectedCity: CityOption = useMemo(() => {
    return {
      id: globalLocation.id,
      name: globalLocation.name,
      latitude: globalLocation.latitude,
      longitude: globalLocation.longitude,
    };
  }, [globalLocation]);

  const setSelectedCity = useCallback(
    (city: CityOption) => {
      setGlobalLocation({
        id: city.id,
        name: city.name,
        cityName: city.name.split(',')[0]?.trim() || city.name,
        stateCode: city.name.split(',')[1]?.trim() || 'US',
        latitude: city.latitude ?? ALL_USA_LOCATION.latitude,
        longitude: city.longitude ?? ALL_USA_LOCATION.longitude,
      });
    },
    [setGlobalLocation],
  );
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(screenId === 'filters');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'map'>(
    screenId === 'map' ? 'map' : 'card',
  );
  const [selectedPinRoomId, setSelectedPinRoomId] = useState<string | null>(null);
  const [isRoomPreviewExpanded, setIsRoomPreviewExpanded] = useState(false);

  // Draggable position for the collapsed badge and expanded room preview card
  const badgePan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const cardPan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const badgePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: () => {
          badgePan.extractOffset();
        },
        onPanResponderMove: Animated.event([null, { dx: badgePan.x, dy: badgePan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          badgePan.flattenOffset();
        },
      }),
    [badgePan],
  );

  const cardPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: () => {
          cardPan.extractOffset();
        },
        onPanResponderMove: Animated.event([null, { dx: cardPan.x, dy: cardPan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          cardPan.flattenOffset();
        },
      }),
    [cardPan],
  );

  // Apple Maps native-style controls state: 3D toggle, map mode, GPS centering
  const [is3D, setIs3D] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [isMapStyleSheetOpen, setIsMapStyleSheetOpen] = useState(false);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [mapCenterTarget, setMapCenterTarget] = useState<{
    latitude: number;
    longitude: number;
    timestamp?: number;
  } | null>(null);
  const [showSearchAreaBtn, setShowSearchAreaBtn] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);

  const handleGpsPress = useCallback(() => {
    setIsGpsActive(true);
    setTimeout(() => setIsGpsActive(false), 2500);

    const applyCoords = (lat: number, lng: number) => {
      setMapCenterTarget({
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
      });
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyCoords(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation high accuracy failed, falling back:', err?.message);
          navigator.geolocation.getCurrentPosition(
            (pos2) => {
              applyCoords(pos2.coords.latitude, pos2.coords.longitude);
            },
            () => {
              applyCoords(
                selectedCity.latitude || ALL_USA_LOCATION.latitude,
                selectedCity.longitude || ALL_USA_LOCATION.longitude,
              );
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
          );
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
      );
    } else {
      applyCoords(
        selectedCity.latitude || ALL_USA_LOCATION.latitude,
        selectedCity.longitude || ALL_USA_LOCATION.longitude,
      );
    }
  }, [selectedCity]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSortModalVisible) {
        setIsSortModalVisible(false);
        return true;
      }
      if (isFilterModalVisible) {
        setIsFilterModalVisible(false);
        return true;
      }
      if (isCityModalVisible) {
        setIsCityModalVisible(false);
        return true;
      }
      if (viewMode === 'map' && screenId !== 'map') {
        setViewMode('card');
        return true;
      }
      router.back();
      return true;
    });
    return () => sub.remove();
  }, [isSortModalVisible, isFilterModalVisible, isCityModalVisible, viewMode, screenId]);

  const createDismissPanResponder = useCallback(
    (onDismiss: () => void) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 30 || gestureState.vy > 0.3) {
            onDismiss();
          }
        },
      }),
    [],
  );

  const citySheetPanResponder = useMemo(
    () => createDismissPanResponder(() => setIsCityModalVisible(false)),
    [createDismissPanResponder],
  );

  const filterSheetPanResponder = useMemo(
    () => createDismissPanResponder(() => setIsFilterModalVisible(false)),
    [createDismissPanResponder],
  );

  const sortSheetPanResponder = useMemo(
    () => createDismissPanResponder(() => setIsSortModalVisible(false)),
    [createDismissPanResponder],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [citySearchInput, setCitySearchInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  const savedRoomsMap = useSavedRoomsStore((s) => s.savedRooms);
  const toggleSaveInStore = useSavedRoomsStore((s) => s.toggleSave);

  const searchedCities = useMemo(() => {
    if (!citySearchInput.trim()) return [];
    return searchAllUSCities(citySearchInput, 35);
  }, [citySearchInput]);

  // Filter state for modal
  const [filterPriceMax, setFilterPriceMax] = useState<number | null>(null);
  const [filterRoomType, setFilterRoomType] = useState<string>('All');
  const [filterDiet, setFilterDiet] = useState<string>('All');
  const [filterGender, setFilterGender] = useState<string>('All');
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterSelectedAmenities, setFilterSelectedAmenities] = useState<string[]>([]);
  const [drawnBoundary, setDrawnBoundary] = useState<Coordinate[] | null>(null);

  const activeFilterCount =
    (filterPriceMax !== null ? 1 : 0) +
    (filterRoomType !== 'All' ? 1 : 0) +
    (filterDiet !== 'All' ? 1 : 0) +
    (filterGender !== 'All' ? 1 : 0) +
    (filterVerifiedOnly ? 1 : 0) +
    filterSelectedAmenities.length;

  // Query real API listings directly from backend / Supabase
  const {
    data: listings,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['rooms', 'listings', globalLocation.name],
    queryFn: () => listRoomListings({ size: 500 }),
    retry: 1,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Transform backend listings into map-enabled extended listings
  const rawListings: ExtendedRoom[] = useMemo(() => {
    const list = listings ?? [];
    return list.map((l, i) => {
      let mapX = 50;
      let mapY = 50;
      if (l.latitude && l.longitude && selectedCity.latitude && selectedCity.longitude) {
        const minLng = selectedCity.longitude - 0.2;
        const maxLng = selectedCity.longitude + 0.2;
        const minLat = selectedCity.latitude - 0.2;
        const maxLat = selectedCity.latitude + 0.2;
        mapX = Math.min(
          85,
          Math.max(15, Math.round(((l.longitude - minLng) / (maxLng - minLng)) * 100)),
        );
        mapY = Math.min(
          85,
          Math.max(15, Math.round(((maxLat - l.latitude) / (maxLat - minLat)) * 100)),
        );
      } else if (l.latitude && l.longitude) {
        mapX = Math.min(
          85,
          Math.max(15, Math.round(((l.longitude - -97.85) / (-97.65 - -97.85)) * 100)),
        );
        mapY = Math.min(
          85,
          Math.max(15, Math.round(((30.55 - l.latitude) / (30.55 - 30.2)) * 100)),
        );
      } else {
        mapX = 25 + ((i * 26) % 55);
        mapY = 22 + ((i * 20) % 55);
      }
      return {
        ...l,
        mapX,
        mapY,
        verifiedHost: true,
      };
    });
  }, [listings, selectedCity]);

  // Step 1: Filter rawListings by active location
  const locationRooms = useMemo(() => {
    const matched = rawListings.filter((room) =>
      matchesRoomLocation(room, selectedCity, globalLocation),
    );
    const selCityLower = (globalLocation.cityName || selectedCity.name.split(',')[0] || '')
      .toLowerCase()
      .trim();

    return matched.sort((a, b) => {
      const aExact =
        a.broadLocation?.toLowerCase().includes(selCityLower) ||
        a.title.toLowerCase().includes(selCityLower)
          ? 1
          : 0;
      const bExact =
        b.broadLocation?.toLowerCase().includes(selCityLower) ||
        b.title.toLowerCase().includes(selCityLower)
          ? 1
          : 0;
      return bExact - aExact;
    });
  }, [rawListings, selectedCity, globalLocation]);

  // Active pin selection defaults to first listing once loaded
  const activePinRoom = useMemo(() => {
    if (selectedPinRoomId) {
      const found = locationRooms.find((r) => r.id === selectedPinRoomId);
      if (found) return found;
    }
    return locationRooms[0] ?? null;
  }, [selectedPinRoomId, locationRooms]);

  // Filter and sort listings
  let filteredRooms = locationRooms.filter((room, idx) => {
    // Hand-drawn boundary filter (Zillow / Apartments.com style)
    if (drawnBoundary && drawnBoundary.length >= 3) {
      const lat = Number(room.latitude) || 30.2672 + (((idx * 17) % 30) - 15) * 0.005;
      const lng = Number(room.longitude) || -97.7431 + (((idx * 23) % 30) - 15) * 0.005;
      if (!isPointInPolygon({ latitude: lat, longitude: lng }, drawnBoundary)) {
        return false;
      }
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchTitle = room.title.toLowerCase().includes(q);
      const matchLoc = (room.broadLocation ?? '').toLowerCase().includes(q);
      const matchType = room.roomType.toLowerCase().includes(q);
      if (!matchTitle && !matchLoc && !matchType) return false;
    }

    // Horizontal category chips
    if (activeCategory === 'Pure Veg Only') {
      const isVeg =
        room.dietaryPreference === 'PURE_VEG' ||
        (room.preferences ?? []).some((p) => p.toLowerCase().includes('veg'));
      if (!isVeg) return false;
    }
    if (activeCategory === 'Private Bath') {
      const hasPrivateBath =
        room.bathroomType === 'PRIVATE_ATTACHED' ||
        room.bathroomType === 'PRIVATE_DEDICATED' ||
        (room.amenities ?? []).some(
          (a) => a.toLowerCase().includes('bath') || a.toLowerCase().includes('private'),
        );
      if (!hasPrivateBath) return false;
    }
    if (activeCategory === 'Female Only') {
      const isFemale =
        room.genderPreference === 'FEMALE_ONLY' ||
        (room.preferences ?? []).some(
          (p) => p.toLowerCase().includes('female') || p.toLowerCase().includes('girls'),
        );
      if (!isFemale) return false;
    }
    if (activeCategory === 'Under $800') {
      if (room.price > 800) return false;
    }
    if (activeCategory === 'Furnished') {
      const isFurnished = (room.amenities ?? []).some(
        (a) => a.toLowerCase().includes('furnished') || a.toLowerCase().includes('bed'),
      );
      if (!isFurnished) return false;
    }

    // Advanced modal filters
    if (filterPriceMax !== null && room.price > filterPriceMax) return false;
    if (filterRoomType !== 'All' && room.roomType !== filterRoomType) return false;
    if (
      filterDiet === 'Veg Only' &&
      !(room.preferences ?? []).some((p) => p.toLowerCase().includes('veg'))
    )
      return false;
    if (
      filterGender === 'Female Only' &&
      !(room.preferences ?? []).some(
        (p) => p.toLowerCase().includes('female') || p.toLowerCase().includes('girls'),
      )
    )
      return false;
    if (filterVerifiedOnly && !room.verifiedHost) return false;

    if (filterSelectedAmenities.length > 0) {
      const roomAmenities = (room.amenities ?? []).map((a) => a.toLowerCase());
      const hasAll = filterSelectedAmenities.every((sel) =>
        roomAmenities.some((ra) => ra.includes(sel.toLowerCase())),
      );
      if (!hasAll) return false;
    }

    return true;
  });

  // Sort
  filteredRooms = [...filteredRooms].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    if (sortBy === 'newest')
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0; // recommended
  });

  const toggleSave = (room: ExtendedRoom) => {
    toggleSaveInStore(room);
  };

  const toggleAmenityFilter = (amenity: string) => {
    setFilterSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity],
    );
  };

  const resetFilters = () => {
    setFilterPriceMax(null);
    setFilterRoomType('All');
    setFilterDiet('All');
    setFilterGender('All');
    setFilterVerifiedOnly(false);
    setFilterSelectedAmenities([]);
    setSortBy('recommended');
  };

  const getAmenityIcon = (amenity: string) => {
    const a = amenity.toLowerCase();
    if (a.includes('wifi') || a.includes('internet')) return '📶 ';
    if (a.includes('bath')) return '🛁 ';
    if (a.includes('w/d') || a.includes('washer') || a.includes('dryer')) return '🧺 ';
    if (a.includes('parking') || a.includes('ev')) return '🚗 ';
    if (a.includes('pool')) return '🏊 ';
    if (a.includes('gym') || a.includes('fitness')) return '🏋️ ';
    if (a.includes('kitchen')) return '🍳 ';
    if (a.includes('ac') || a.includes('air')) return '❄️ ';
    if (a.includes('furnished') || a.includes('bed')) return '🛏️ ';
    if (a.includes('balcony')) return '🌅 ';
    return '✦ ';
  };

  const getPreferenceIcon = (pref: string) => {
    const p = pref.toLowerCase();
    if (p.includes('veg')) return '🥦 ';
    if (p.includes('female') || p.includes('girls')) return '👩 ';
    if (p.includes('male') || p.includes('boys')) return '👨 ';
    if (p.includes('working') || p.includes('tech') || p.includes('swe')) return '💼 ';
    if (p.includes('student') || p.includes('grad')) return '🎓 ';
    if (p.includes('smok')) return '🚭 ';
    return '🤝 ';
  };

  const getRoomHeroEmoji = (roomType: string) => {
    const t = (roomType || '').toLowerCase();
    if (
      t.includes('entire') ||
      t.includes('house') ||
      t.includes('villa') ||
      t.includes('townhouse')
    )
      return '🏡';
    if (
      t.includes('studio') ||
      t.includes('apartment') ||
      t.includes('1 bhk') ||
      t.includes('2 bhk')
    )
      return '🏢';
    if (t.includes('master') || t.includes('private')) return '🛏️';
    if (t.includes('shared')) return '👥';
    return '🛋️';
  };

  const getRoomCulturalFlags = (room: ExtendedRoom) => {
    const isPureVeg =
      room.title.toLowerCase().includes('pure veg') ||
      (room.amenities ?? []).some((a) => a.toLowerCase().includes('pure veg')) ||
      (room.preferences ?? []).some((p) => p.toLowerCase().includes('pure veg'));
    const isPrivateBath =
      room.title.toLowerCase().includes('attached') ||
      room.title.toLowerCase().includes('private bath') ||
      (room.amenities ?? []).some(
        (a) => a.toLowerCase().includes('private') || a.toLowerCase().includes('attached'),
      );
    const isFurnished =
      room.title.toLowerCase().includes('furnish') ||
      (room.amenities ?? []).some((a) => a.toLowerCase().includes('furnish'));
    return { isPureVeg, isPrivateBath, isFurnished };
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={s.safeArea}>
      {/* ─── Top Header ──────────────────────────────────────────────────────── */}
      <View style={[s.header, isDesktop && s.headerDesktop]}>
        <View style={s.headerTop}>
          <Pressable
            onPress={() => router.push('/home')}
            style={s.backBtn}
            accessibilityLabel="Back to Home"
          >
            <AppIcon color={colors.ink} name="chevron-left" size={20} />
          </Pressable>

          {/* Interactive City Selector Pill */}
          <Pressable
            onPress={() => setIsCityModalVisible(true)}
            style={s.locationSelector}
            accessibilityLabel="Select city"
          >
            <AppIcon color={colors.appPrimary} name="map" size={14} />
            <Text style={s.locationTitle} numberOfLines={1} ellipsizeMode="tail">
              {selectedCity.name}
            </Text>
            <AppIcon color={colors.muted} name="chevron-down" size={14} />
          </Pressable>

          <View style={s.headerActions}>
            <Link href="/rooms/my-listings" asChild>
              <Pressable
                accessibilityLabel="My Created Rooms"
                style={StyleSheet.flatten(s.myRoomsBtn)}
              >
                <AppIcon color="#ffffff" name="home" size={14} />
                <Text style={s.myRoomsBtnText}>My Rooms</Text>
              </Pressable>
            </Link>
            <Link href="/rooms/saved" asChild>
              <Pressable accessibilityLabel="Saved Rooms" style={StyleSheet.flatten(s.iconBtn)}>
                <AppIcon color={colors.appPrimary} name="star" size={18} />
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Search Bar with live clear & filter button */}
        <View style={s.searchBarContainer}>
          <AppIcon color={colors.muted} name="search" size={18} />
          <TextInput
            placeholder={`Search ${selectedCity.name.split(',')[0]} rooms, tech hubs, rent...`}
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={s.searchInput}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} style={s.clearBtn}>
              <Text style={s.clearBtnText}>✕</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setIsFilterModalVisible(true)}
            style={StyleSheet.flatten(s.filterPillBtn)}
            accessibilityLabel="Open filters and sorting"
          >
            <AppIcon color={colors.appPrimary} name="wrench" size={14} />
            <Text style={s.filterPillBtnText}>
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </Pressable>
        </View>

        {/* View Mode (List vs Map) & Sort Bar */}
        <View style={s.toolbarRow}>
          {/* Segmented control: List vs Card vs Map */}
          <View style={s.segmentedControl}>
            <Pressable
              onPress={() => setViewMode('list')}
              style={[s.segmentBtn, viewMode === 'list' && s.segmentBtnActive]}
            >
              <Text style={[s.segmentBtnText, viewMode === 'list' && s.segmentBtnTextActive]}>
                📋 List
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('card')}
              style={[s.segmentBtn, viewMode === 'card' && s.segmentBtnActive]}
            >
              <Text style={[s.segmentBtnText, viewMode === 'card' && s.segmentBtnTextActive]}>
                🃏 Card
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('map')}
              style={[s.segmentBtn, viewMode === 'map' && s.segmentBtnActive]}
            >
              <Text style={[s.segmentBtnText, viewMode === 'map' && s.segmentBtnTextActive]}>
                🗺️ Map
              </Text>
            </Pressable>
          </View>

          {/* Sort button beside the tabs that opens the dedicated Sort bottom sheet */}
          <Pressable
            onPress={() => setIsSortModalVisible(true)}
            style={s.toolbarSortBtn}
            accessibilityLabel="Open sort bottom sheet"
          >
            <AppIcon color={colors.appPrimary} name="filter-list" size={15} />
            <Text style={s.toolbarSortBtnText}>
              {SORT_OPTIONS.find((o) => o.id === sortBy)?.label || 'Sort'}
            </Text>
            <AppIcon color={colors.muted} name="chevron-down" size={12} />
          </Pressable>
        </View>

        {/* Category Pill Filters with Icons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.categoryScroll}
        >
          {filterCategories.map((cat) => (
            <Pressable
              key={cat.id}
              testID={cat.id === 'veg' ? 'filter-chip-pure-veg' : undefined}
              onPress={() => setActiveCategory(cat.label)}
              style={[s.categoryChip, activeCategory === cat.label && s.categoryChipActive]}
            >
              <Text
                style={[
                  s.categoryChipText,
                  activeCategory === cat.label && s.categoryChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ─── BODY CONTENT: MAP VIEW vs LIST VIEW vs DUAL PANE ───────────────── */}
      {(() => {
        const renderMapView = () => {
          const cityLat = selectedCity.latitude || 30.2672;
          const cityLng = selectedCity.longitude || -97.7431;

          const mapMarkers = filteredRooms.map((room, idx) => ({
            id: room.id,
            latitude: Number(room.latitude) || cityLat + (((idx * 17) % 30) - 15) * 0.005,
            longitude: Number(room.longitude) || cityLng + (((idx * 23) % 30) - 15) * 0.005,
            title: room.title,
            price: room.price,
            subtitle: `${room.roomType} • ${room.broadLocation}`,
            isSelected: activePinRoom?.id === room.id,
          }));

          const initialLat = selectedCity.latitude || mapMarkers[0]?.latitude || 30.2672;
          const initialLng = selectedCity.longitude || mapMarkers[0]?.longitude || -97.7431;

          return (
            <View
              testID={isDualPane ? 'desktop-split-map' : 'map-container'}
              style={[s.mapContainer, isDualPane && s.mapContainerDualPane]}
            >
              <UniversalMapView
                initialRegion={{
                  latitude: initialLat,
                  longitude: initialLng,
                  latitudeDelta: 0.14,
                  longitudeDelta: 0.14,
                }}
                showsUserLocation={true}
                mapType={mapType}
                is3D={is3D}
                centerCoordinate={mapCenterTarget}
                markers={mapMarkers}
                selectedMarkerId={activePinRoom?.id}
                onSelectMarker={(id) => {
                  setSelectedPinRoomId(id);
                  setIsRoomPreviewExpanded(true);
                }}
                style={StyleSheet.absoluteFill}
                enableDrawing={true}
                drawnPolygon={drawnBoundary}
                onPolygonComplete={(poly) => setDrawnBoundary(poly)}
                onClearPolygon={() => setDrawnBoundary(null)}
                onRegionChangeComplete={(reg) => {
                  const minLat = reg.latitude - reg.latitudeDelta / 2;
                  const maxLat = reg.latitude + reg.latitudeDelta / 2;
                  const minLng = reg.longitude - reg.longitudeDelta / 2;
                  const maxLng = reg.longitude + reg.longitudeDelta / 2;
                  setViewportBounds({ minLat, maxLat, minLng, maxLng });
                  setShowSearchAreaBtn(true);
                }}
              />

              {/* Apple Maps Floating Controls: Map Mode, 3D, and GPS (Hidden when Google Maps is active) */}
              {isAppleMapsActive && (
                <View style={s.appleMapsControlCluster}>
                  {/* 1. Map Mode (Layers) Button */}
                  <Pressable
                    onPress={() => setIsMapStyleSheetOpen(!isMapStyleSheetOpen)}
                    style={[s.appleMapBtn, isMapStyleSheetOpen && s.appleMapBtnActive]}
                    accessibilityLabel="Choose Map Mode"
                  >
                    <Text style={s.appleMapIcon}>🗺️</Text>
                  </Pressable>

                  {/* 2. 3D / 2D Perspective Toggle Button */}
                  <Pressable
                    onPress={() => setIs3D(!is3D)}
                    style={[s.appleMapBtn, is3D && s.appleMapBtnActive]}
                    accessibilityLabel={is3D ? 'Switch to 2D view' : 'Switch to 3D perspective'}
                  >
                    <Text style={[s.appleMap3DText, is3D && s.appleMap3DTextActive]}>
                      {is3D ? '2D' : '3D'}
                    </Text>
                  </Pressable>

                  {/* 3. GPS Current Location Button */}
                  <Pressable
                    onPress={handleGpsPress}
                    style={[s.appleMapBtn, s.appleMapBtnLast, isGpsActive && s.appleMapBtnActive]}
                    accessibilityLabel="Center Current GPS Location"
                  >
                    <Text style={[s.appleMapGpsIcon, isGpsActive && s.appleMapGpsIconActive]}>
                      {isGpsActive ? '➤' : '⌖'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Apple Maps Mode Selector Popover */}
              {isAppleMapsActive && isMapStyleSheetOpen && (
                <View style={s.appleMapStyleMenu}>
                  <Text style={s.appleMapStyleTitle}>MAP MODE</Text>
                  {(['standard', 'satellite', 'hybrid'] as const).map((type) => {
                    const isSelected = mapType === type;
                    const meta: Record<string, { label: string; icon: string; desc: string }> = {
                      standard: { label: 'Explore', icon: '🗺️', desc: 'Roads & transit' },
                      satellite: { label: 'Satellite', icon: '🛰️', desc: 'Aerial photography' },
                      hybrid: { label: 'Hybrid', icon: '🌐', desc: 'Satellite + streets' },
                    };
                    return (
                      <Pressable
                        key={type}
                        onPress={() => {
                          setMapType(type);
                          setIsMapStyleSheetOpen(false);
                        }}
                        style={[s.appleMapStyleOption, isSelected && s.appleMapStyleOptionSelected]}
                      >
                        <Text style={s.appleMapStyleIcon}>{meta[type].icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[s.appleMapStyleText, isSelected && s.appleMapStyleTextSelected]}
                          >
                            {meta[type].label}
                          </Text>
                          <Text style={s.appleMapStyleDesc}>{meta[type].desc}</Text>
                        </View>
                        {isSelected ? <Text style={s.appleMapStyleCheck}>✓</Text> : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Draggable Collapsed Room Preview Trigger Icon (draggable to any position on map) */}
              {!isRoomPreviewExpanded && activePinRoom ? (
                <Animated.View
                  {...badgePanResponder.panHandlers}
                  style={[
                    s.collapsedCardTriggerBtn,
                    {
                      transform: badgePan.getTranslateTransform(),
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => setIsRoomPreviewExpanded(true)}
                    style={s.collapsedCardInner}
                    accessibilityLabel="Show room preview (drag to move)"
                  >
                    <Text style={s.cardDragGrip}>⠿</Text>
                    <Text style={s.collapsedCardIcon}>🏢</Text>
                    <Text style={s.collapsedCardText}>${activePinRoom.price}/mo</Text>
                    <Text style={s.collapsedCardChevron}>▴</Text>
                  </Pressable>
                </Animated.View>
              ) : null}

              {/* Draggable Floating Selected Room Card (draggable to any position on map) */}
              {isRoomPreviewExpanded && activePinRoom ? (
                <Animated.View
                  {...cardPanResponder.panHandlers}
                  style={[
                    s.floatingMapCardContainer,
                    {
                      transform: cardPan.getTranslateTransform(),
                    },
                  ]}
                >
                  <View style={s.floatingMapCard}>
                    {/* Subtle Drag Handle Bar */}
                    <View style={s.cardDragBarContainer}>
                      <View style={s.cardDragBar} />
                    </View>

                    {/* Minimize / Close button */}
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setIsRoomPreviewExpanded(false);
                      }}
                      style={s.cardCloseBtn}
                      accessibilityLabel="Hide room preview"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={s.cardCloseText}>✕</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => router.push(`/rooms/${activePinRoom.id}` as Href)}
                      style={s.floatingMapCardInner}
                    >
                      <View style={s.floatingThumb}>
                        <Text style={s.floatingEmoji}>🏢</Text>
                        <View style={s.floatingPriceTag}>
                          <Text style={s.floatingPriceVal}>${activePinRoom.price}/mo</Text>
                        </View>
                      </View>
                      <View style={s.floatingInfo}>
                        <View style={s.floatingTypeRow}>
                          <Text style={s.floatingType}>🚪 {activePinRoom.roomType}</Text>
                          <Text style={s.floatingBath}>
                            {activePinRoom.bathroomType === 'PRIVATE_ATTACHED'
                              ? '• 🚿 Private Bath'
                              : '• 🚪 Shared Bath'}
                          </Text>
                        </View>
                        <Text style={s.floatingTitle} numberOfLines={1}>
                          {activePinRoom.title}
                        </Text>
                        <Text style={s.floatingLocation} numberOfLines={1}>
                          📍 {activePinRoom.broadLocation}
                        </Text>
                        <View style={s.floatingCtaRow}>
                          <View style={s.floatingDetailsBtn}>
                            <Text style={s.floatingDetailsLink}>View Details →</Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </View>
                </Animated.View>
              ) : null}

              {/* Zillow-style Floating Switch to List View Button (Visible only when area is drawn) */}
              {drawnBoundary && drawnBoundary.length >= 3 && (
                <View
                  style={[
                    s.zillowFloatingSwitchWrapper,
                    isRoomPreviewExpanded && activePinRoom
                      ? s.zillowFloatingSwitchWrapperTop
                      : s.zillowFloatingSwitchWrapperBottom,
                    { pointerEvents: 'box-none' },
                  ]}
                >
                  <Pressable
                    onPress={() => setViewMode('list')}
                    style={({ pressed }) => [
                      s.zillowFloatingSwitchBtn,
                      pressed && s.zillowFloatingSwitchBtnPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${filteredRooms.length} listings in drawn area`}
                  >
                    <Text style={s.zillowFloatingSwitchIcon}>📋</Text>
                    <Text style={s.zillowFloatingSwitchText}>
                      View {filteredRooms.length} {filteredRooms.length === 1 ? 'Room' : 'Rooms'} in
                      Area
                    </Text>
                    <Text style={s.zillowFloatingSwitchArrow}>➔</Text>
                  </Pressable>
                </View>
              )}
              {/* Floating "Search This Area" Pill */}
              {showSearchAreaBtn && (
                <View style={[s.searchThisAreaWrapper, { pointerEvents: 'box-none' }]}>
                  <Pressable
                    onPress={() => {
                      setShowSearchAreaBtn(false);
                      if (viewportBounds) {
                        setDrawnBoundary([
                          { latitude: viewportBounds.minLat, longitude: viewportBounds.minLng },
                          { latitude: viewportBounds.maxLat, longitude: viewportBounds.minLng },
                          { latitude: viewportBounds.maxLat, longitude: viewportBounds.maxLng },
                          { latitude: viewportBounds.minLat, longitude: viewportBounds.maxLng },
                        ]);
                      }
                    }}
                    style={s.searchThisAreaBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Search this area"
                  >
                    <Text style={s.searchThisAreaIcon}>🔍</Text>
                    <Text style={s.searchThisAreaText}>Search This Area</Text>
                  </Pressable>
                </View>
              )}

              {/* Zillow-style Snapping Bottom Card Carousel with Bidirectional Map Sync */}
              {!isDualPane && viewMode === 'map' && filteredRooms.length > 0 && (
                <RoomMapCarousel
                  listings={filteredRooms}
                  selectedListingId={activePinRoom?.id ?? null}
                  onSelectListing={(room) => {
                    setSelectedPinRoomId(room.id);
                  }}
                  onListingSnap={(room) => {
                    setSelectedPinRoomId(room.id);
                    if (room.latitude && room.longitude) {
                      setMapCenterTarget({
                        latitude: Number(room.latitude),
                        longitude: Number(room.longitude),
                        timestamp: Date.now(),
                      });
                    }
                  }}
                />
              )}
            </View>
          );
        };

        const renderCardItem = (room: ExtendedRoom) => {
          const isSaved = Boolean(savedRoomsMap[room.id] || room.savedByViewer);
          const { isPureVeg, isPrivateBath, isFurnished } = getRoomCulturalFlags(room);

          return (
            <Pressable
              key={room.id}
              testID="room-listing-card"
              onPress={() => {
                if (isDualPane) {
                  setSelectedPinRoomId(room.id);
                }
                router.push(`/rooms/${room.id}` as Href);
              }}
              onHoverIn={() => {
                if (isDualPane) {
                  setSelectedPinRoomId(room.id);
                }
              }}
              style={[
                s.roomCardContainer,
                isDualPane && s.roomFeedCardDualPane,
                isDualPane && activePinRoom?.id === room.id && s.roomCardContainerActiveDualPane,
              ]}
            >
              {/* Visual Hero Banner */}
              <View style={s.roomCardHero}>
                <View style={s.roomCardHeroGraphic}>
                  <Text style={s.roomCardHeroEmoji}>{getRoomHeroEmoji(room.roomType)}</Text>
                </View>

                {/* Room Type badge floating top-left */}
                <View style={s.roomCardHeroTypeBadge}>
                  <Text style={s.roomCardHeroTypeBadgeText}>🚪 {room.roomType}</Text>
                </View>

                {/* Favorite save button floating top-right */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleSave(room);
                  }}
                  style={s.roomCardHeroSaveBtn}
                  accessibilityLabel={isSaved ? 'Unsave room' : 'Save room'}
                >
                  <AppIcon color={isSaved ? '#e02424' : '#1a1c28'} name="star" size={17} />
                </Pressable>

                {/* Price tag badge floating bottom-left */}
                <View style={s.roomCardHeroPriceBadge}>
                  <Text style={s.roomCardHeroPriceVal}>${room.price}</Text>
                  <Text style={s.roomCardHeroPricePeriod}>/mo</Text>
                </View>

                {/* Verified Host pill floating bottom-right */}
                <View style={s.roomCardHeroVerifiedBadge}>
                  <Text style={s.roomCardHeroVerifiedText}>✓ Verified Host</Text>
                </View>
              </View>

              {/* Card Body */}
              <View style={s.roomCardBody}>
                <Text style={s.roomCardTitle} numberOfLines={2}>
                  {room.title}
                </Text>

                <View style={s.roomCardLocationRow}>
                  <AppIcon color={colors.appPrimary} name="map" size={13} />
                  <Text style={s.roomCardLocationText} numberOfLines={1}>
                    {room.broadLocation}
                  </Text>
                </View>

                {/* Cultural, Dietary, and Housing Badges */}
                {(isPureVeg || isPrivateBath || isFurnished) && (
                  <View style={s.culturalBadgesRow}>
                    {isPureVeg && (
                      <View style={s.badgePureVeg}>
                        <Text style={s.badgeTextPureVeg}>🥦 Pure Veg</Text>
                      </View>
                    )}
                    {isPrivateBath && (
                      <View style={s.badgePrivateBath}>
                        <Text style={s.badgeTextPrivateBath}>🚿 Private Bath</Text>
                      </View>
                    )}
                    {isFurnished && (
                      <View style={s.badgeFurnished}>
                        <Text style={s.badgeTextFurnished}>🛏️ Furnished</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Highlights & Amenities with Icons */}
                <View style={s.amenitiesRow}>
                  {(room.preferences ?? []).slice(0, 2).map((pref) => (
                    <View key={pref} style={s.amenityChip}>
                      <Text style={s.amenityChipText}>
                        {getPreferenceIcon(pref)}
                        {pref}
                      </Text>
                    </View>
                  ))}
                  {(room.amenities ?? []).slice(0, 3).map((amenity) => (
                    <View key={amenity} style={s.featureChip}>
                      <Text style={s.featureChipText}>
                        {getAmenityIcon(amenity)}
                        {amenity}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Footer with Host Info & CTAs */}
                <View style={s.roomCardFooter}>
                  <View style={s.hostInfo}>
                    <View style={s.hostAvatar}>
                      <Text style={s.hostAvatarText}>{room.title[0] || 'M'}</Text>
                    </View>
                    <View>
                      <Text style={s.hostName}>Verified Landlord</Text>
                      <Text style={s.hostMeta}>Direct Contact · Quick Response</Text>
                    </View>
                  </View>

                  <View style={s.cardActions}>
                    <Link href={`/rooms/${room.id}/inquiry` as Href} asChild>
                      <Pressable
                        onPress={(e) => e.stopPropagation()}
                        style={StyleSheet.flatten(s.inquireBtn)}
                      >
                        <Text style={s.inquireBtnText}>Inquire</Text>
                      </Pressable>
                    </Link>
                    <Link href={`/rooms/${room.id}` as Href} asChild>
                      <Pressable
                        onPress={(e) => e.stopPropagation()}
                        style={StyleSheet.flatten(s.viewDetailsBtn)}
                      >
                        <Text style={s.viewDetailsBtnText}>Details →</Text>
                      </Pressable>
                    </Link>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        };

        const renderListItem = (room: ExtendedRoom) => {
          const isSaved = Boolean(savedRoomsMap[room.id] || room.savedByViewer);
          const { isPureVeg, isPrivateBath, isFurnished } = getRoomCulturalFlags(room);

          return (
            <Pressable
              key={room.id}
              testID="room-listing-card"
              onPress={() => {
                if (isDualPane) {
                  setSelectedPinRoomId(room.id);
                }
                router.push(`/rooms/${room.id}` as Href);
              }}
              onHoverIn={() => {
                if (isDualPane) {
                  setSelectedPinRoomId(room.id);
                }
              }}
              style={[
                s.roomListItem,
                isDualPane && s.roomFeedCardDualPane,
                isDualPane && activePinRoom?.id === room.id && s.roomCardContainerActiveDualPane,
              ]}
            >
              {/* Left: Compact thumbnail with price */}
              <View style={s.roomListThumb}>
                <Text style={s.roomListEmoji}>{getRoomHeroEmoji(room.roomType)}</Text>
                <View style={s.roomListPriceBadge}>
                  <Text style={s.roomListPriceVal}>${room.price}</Text>
                  <Text style={s.roomListPricePeriod}>/mo</Text>
                </View>
              </View>

              {/* Middle: Details */}
              <View style={s.roomListMain}>
                <View style={s.roomListTopRow}>
                  <View style={s.roomTypeTag}>
                    <Text style={s.roomTypeTagText}>🚪 {room.roomType}</Text>
                  </View>
                  <Text style={s.roomListLocationText} numberOfLines={1}>
                    📍 {room.broadLocation}
                  </Text>
                </View>

                <Text style={s.roomListTitle} numberOfLines={1}>
                  {room.title}
                </Text>

                {/* Compact Badges Row */}
                <View style={s.roomListBadgesRow}>
                  {isPureVeg && (
                    <View style={s.badgePureVegSmall}>
                      <Text style={s.badgeTextPureVegSmall}>🥦 Veg</Text>
                    </View>
                  )}
                  {isPrivateBath && (
                    <View style={s.badgePrivateBathSmall}>
                      <Text style={s.badgeTextPrivateBathSmall}>🚿 Bath</Text>
                    </View>
                  )}
                  {isFurnished && (
                    <View style={s.badgeFurnishedSmall}>
                      <Text style={s.badgeTextFurnishedSmall}>🛏️ Furnished</Text>
                    </View>
                  )}
                  {(room.amenities ?? []).slice(0, 2).map((a) => (
                    <View key={a} style={s.featureChipSmall}>
                      <Text style={s.featureChipTextSmall}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Right: Save & Arrow */}
              <View style={s.roomListRightCol}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleSave(room);
                  }}
                  style={s.roomListSaveBtn}
                  accessibilityLabel={isSaved ? 'Unsave room' : 'Save room'}
                >
                  <AppIcon color={isSaved ? '#e02424' : colors.muted} name="star" size={17} />
                </Pressable>
                <View style={s.roomListViewArrow}>
                  <AppIcon color={colors.appPrimary} name="chevron-right" size={16} />
                </View>
              </View>
            </Pressable>
          );
        };

        const renderListView = () => (
          <ScrollView
            contentContainerStyle={[
              s.content,
              { paddingBottom: Math.max(insets.bottom, 16) + 80 },
              isDesktop && !isDualPane && s.contentDesktop,
              isDualPane && s.contentDualPane,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={colors.appPrimary}
                colors={[colors.appPrimary]}
              />
            }
          >
            {/* Header Section info */}
            <View style={s.sectionHeader}>
              <View>
                <Text style={s.sectionTitle}>Available Rooms ({filteredRooms.length})</Text>
                <Text style={s.sectionSub}>
                  {`Verified housing & shared rooms in ${selectedCity.name}`}
                </Text>
              </View>
            </View>

            {/* Hand-drawn area active banner */}
            {drawnBoundary && drawnBoundary.length >= 3 && (
              <View style={s.drawnBoundaryFilterChip}>
                <Text style={s.drawnBoundaryFilterText}>
                  ✏️ Showing {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'}{' '}
                  inside drawn boundary
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Pressable
                    onPress={() => setViewMode('map')}
                    style={s.drawnBoundaryMapBtn}
                    accessibilityLabel="Return to map view"
                  >
                    <Text style={s.drawnBoundaryMapText}>🗺️ Map</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setDrawnBoundary(null)}
                    style={s.drawnBoundaryClearBtn}
                    accessibilityLabel="Clear drawn area filter"
                  >
                    <Text style={s.drawnBoundaryClearText}>✕ Clear</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Room Listings Feed */}
            {isLoading ? (
              <View style={s.loadingBox}>
                <ActivityIndicator size="large" color={colors.appPrimary} />
                <Text style={s.loadingText}>Finding available rooms in {selectedCity.name}...</Text>
              </View>
            ) : filteredRooms.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyEmoji}>{locationRooms.length === 0 ? '📍' : '🔍'}</Text>
                <Text style={s.emptyTitle}>
                  {locationRooms.length === 0
                    ? `No rooms in ${selectedCity.name} yet`
                    : 'No rooms match your filters'}
                </Text>
                <Text style={s.emptySub}>
                  {locationRooms.length === 0
                    ? `Be the first to list a room in ${selectedCity.name}, or explore all available cities nationwide.`
                    : 'Try selecting a different filter or reset all filters to view all available rooms.'}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 10,
                    marginTop: 12,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  {locationRooms.length === 0 ? (
                    <>
                      <Pressable
                        onPress={() => setSelectedCity(ALL_USA_LOCATION)}
                        style={s.resetFilterBtn}
                      >
                        <Text style={s.resetFilterBtnText}>Browse All Cities (USA)</Text>
                      </Pressable>
                      <Link href="/rooms/create-listing" asChild>
                        <Pressable style={s.resetFilterBtn}>
                          <Text style={s.resetFilterBtnText}>+ Post a Room</Text>
                        </Pressable>
                      </Link>
                    </>
                  ) : (
                    <Pressable onPress={resetFilters} style={s.resetFilterBtn}>
                      <Text style={s.resetFilterBtnText}>Reset All Filters</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ) : (
              <View style={isDualPane && viewMode === 'card' ? s.dualPaneCardGrid : undefined}>
                {filteredRooms.map((room) =>
                  viewMode === 'list' ? renderListItem(room) : renderCardItem(room),
                )}
              </View>
            )}
          </ScrollView>
        );

        if (isDualPane) {
          return (
            <View style={s.dualPaneContainer}>
              <View style={s.dualPaneLeft}>{renderListView()}</View>
              <View testID="desktop-split-map" style={s.dualPaneRight}>
                {renderMapView()}
              </View>
            </View>
          );
        }

        return viewMode === 'map' ? renderMapView() : renderListView();
      })()}

      {/* ─── Floating Action Button: Post a Room (Hidden in Map View) ───────────── */}
      {viewMode !== 'map' && (
        <Link href="/rooms/create-listing" asChild>
          <Pressable
            accessibilityLabel="Post a room"
            accessibilityRole="button"
            style={StyleSheet.flatten([s.fab, { bottom: Math.max(insets.bottom, 16) + 12 }])}
          >
            <AppIcon color="#fff" name="plus" size={20} />
            <Text style={s.fabText}>Post a Room</Text>
          </Pressable>
        </Link>
      )}

      {/* ─── City Selector Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={isCityModalVisible}
        transparent
        animationType={isDesktop ? 'fade' : 'slide'}
        onRequestClose={() => setIsCityModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[s.modalOverlay, !isDesktop && s.modalOverlayMobile]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsCityModalVisible(false)} />
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[s.cityModalCard, !isDesktop && s.cityModalCardMobile]}
          >
            {!isDesktop ? (
              <View {...citySheetPanResponder.panHandlers} style={s.bottomSheetHandleArea}>
                <View style={s.bottomSheetHandle} />
              </View>
            ) : null}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select City</Text>
            </View>
            <Text style={s.modalSubtitle}>Search or select any US city</Text>

            <View style={s.citySearchBox}>
              <AppIcon color={colors.muted} name="search" size={16} />
              <TextInput
                value={citySearchInput}
                onChangeText={setCitySearchInput}
                placeholder="Search all 19,000+ US cities (e.g. Coppell, Frisco, Jonesboro)..."
                placeholderTextColor={colors.muted}
                style={s.citySearchInput}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {citySearchInput.length > 0 && (
                <Pressable onPress={() => setCitySearchInput('')} hitSlop={8}>
                  <Text style={s.citySearchClearText}>✕</Text>
                </Pressable>
              )}
            </View>

            <ScrollView
              style={s.cityModalScrollView}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              {citySearchInput.trim().length > 0 ? (
                <>
                  <Text style={s.citySectionLabel}>SEARCH RESULTS ({searchedCities.length})</Text>
                  {searchedCities.length === 0 ? (
                    <View style={s.cityEmptyResults}>
                      <Text style={s.cityEmptyText}>
                        No cities found matching "{citySearchInput}". Try another city name.
                      </Text>
                    </View>
                  ) : (
                    searchedCities.map((city) => {
                      const isSelected = selectedCity.name === city.name;
                      return (
                        <Pressable
                          key={city.id}
                          onPress={() => {
                            setSelectedCity({
                              id: city.id,
                              name: city.name,
                              landmarks: [],
                              latitude: city.latitude,
                              longitude: city.longitude,
                            });
                            setCitySearchInput('');
                            setIsCityModalVisible(false);
                          }}
                          style={[s.cityOptionRow, isSelected && s.cityOptionRowActive]}
                        >
                          <View style={s.cityOptionLeft}>
                            <AppIcon
                              color={isSelected ? colors.appPrimary : colors.muted}
                              name="map"
                              size={16}
                            />
                            <View>
                              <Text
                                style={[s.cityOptionName, isSelected && s.cityOptionNameActive]}
                              >
                                {city.name}
                              </Text>
                              <Text style={s.cityOptionLandmarks}>
                                United States • {city.stateCode}
                              </Text>
                            </View>
                          </View>
                          <View style={s.citySelectPill}>
                            <Text style={s.citySelectPillText}>
                              {isSelected ? 'Selected' : 'Select'}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })
                  )}
                </>
              ) : (
                <>
                  {/* 1. Detected / Current Location */}
                  <Text style={s.citySectionLabel}>📍 CURRENT LOCATION</Text>
                  <Pressable
                    onPress={() => {
                      if (detectedLocation) {
                        setSelectedCity(detectedLocation);
                        setIsCityModalVisible(false);
                      } else {
                        detectDeviceLocation();
                      }
                    }}
                    style={[
                      s.cityOptionRow,
                      detectedLocation &&
                        selectedCity.id === detectedLocation.id &&
                        s.cityOptionRowActive,
                    ]}
                  >
                    <View style={s.cityOptionLeft}>
                      <AppIcon
                        color={
                          detectedLocation && selectedCity.id === detectedLocation.id
                            ? colors.appPrimary
                            : colors.muted
                        }
                        name="compass"
                        size={16}
                      />
                      <View>
                        <Text
                          style={[
                            s.cityOptionName,
                            detectedLocation &&
                              selectedCity.id === detectedLocation.id &&
                              s.cityOptionNameActive,
                          ]}
                        >
                          {detectedLocation ? detectedLocation.name : 'Detect My Location'}
                        </Text>
                        <Text style={s.cityOptionLandmarks}>
                          {isDetecting
                            ? 'Detecting via GPS / Network...'
                            : detectedLocation
                              ? 'Device GPS / Local Network'
                              : 'Tap to locate nearest US city'}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        s.cityCountPill,
                        detectedLocation &&
                          selectedCity.id === detectedLocation.id &&
                          s.cityCountPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          s.cityCountText,
                          detectedLocation &&
                            selectedCity.id === detectedLocation.id &&
                            s.cityCountTextActive,
                        ]}
                      >
                        {isDetecting
                          ? 'Locating...'
                          : detectedLocation && selectedCity.id === detectedLocation.id
                            ? 'Active'
                            : 'Detect'}
                      </Text>
                    </View>
                  </Pressable>

                  {/* 2. Nearby Cities (4 to 5 nearby cities based on distance) */}
                  {nearbyCities.length > 0 && (
                    <>
                      <Text style={s.citySectionLabel}>🚗 NEARBY CITIES</Text>
                      {nearbyCities.map((city) => {
                        const isSelected = selectedCity.id === city.id;
                        return (
                          <Pressable
                            key={city.id}
                            onPress={() => {
                              setSelectedCity(city);
                              setIsCityModalVisible(false);
                            }}
                            style={[s.cityOptionRow, isSelected && s.cityOptionRowActive]}
                          >
                            <View style={s.cityOptionLeft}>
                              <AppIcon
                                color={isSelected ? colors.appPrimary : colors.muted}
                                name="map"
                                size={16}
                              />
                              <View>
                                <Text
                                  style={[s.cityOptionName, isSelected && s.cityOptionNameActive]}
                                >
                                  {city.name}
                                </Text>
                                <Text style={s.cityOptionLandmarks}>
                                  {city.distanceMiles
                                    ? `${city.distanceMiles} mi away`
                                    : `${city.stateCode}, USA`}
                                </Text>
                              </View>
                            </View>
                            <View style={[s.cityCountPill, isSelected && s.cityCountPillActive]}>
                              <Text style={[s.cityCountText, isSelected && s.cityCountTextActive]}>
                                {isSelected ? 'Active' : `${city.distanceMiles ?? ''} mi`}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </>
                  )}

                  {/* 3. All Cities (USA) */}
                  <Text style={s.citySectionLabel}>🇺🇸 ALL LOCATIONS</Text>
                  <Pressable
                    onPress={() => {
                      setSelectedCity(ALL_USA_LOCATION);
                      setIsCityModalVisible(false);
                    }}
                    style={[
                      s.cityOptionRow,
                      selectedCity.id === ALL_USA_LOCATION.id && s.cityOptionRowActive,
                    ]}
                  >
                    <View style={s.cityOptionLeft}>
                      <AppIcon
                        color={
                          selectedCity.id === ALL_USA_LOCATION.id ? colors.appPrimary : colors.muted
                        }
                        name="globe"
                        size={16}
                      />
                      <View>
                        <Text
                          style={[
                            s.cityOptionName,
                            selectedCity.id === ALL_USA_LOCATION.id && s.cityOptionNameActive,
                          ]}
                        >
                          All Cities (USA)
                        </Text>
                        <Text style={s.cityOptionLandmarks}>
                          View listings across all 50 states
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        s.cityCountPill,
                        selectedCity.id === ALL_USA_LOCATION.id && s.cityCountPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          s.cityCountText,
                          selectedCity.id === ALL_USA_LOCATION.id && s.cityCountTextActive,
                        ]}
                      >
                        {rawListings.length} total
                      </Text>
                    </View>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── DEDICATED SORT BOTTOM SHEET (Mobile bottom-up, Web centered) ──────── */}
      <Modal
        visible={isSortModalVisible}
        transparent
        animationType={isDesktop ? 'fade' : 'slide'}
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <Pressable
          onPress={() => setIsSortModalVisible(false)}
          style={[s.modalOverlay, !isDesktop && s.modalOverlayMobile]}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[s.sortModalCard, !isDesktop && s.sortModalCardMobile]}
          >
            {!isDesktop ? (
              <View {...sortSheetPanResponder.panHandlers} style={s.bottomSheetHandleArea}>
                <View style={s.bottomSheetHandle} />
              </View>
            ) : null}

            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppIcon color={colors.appPrimary} name="filter-list" size={18} />
                <Text style={s.modalTitle}>Sort Listings By</Text>
              </View>
              <Pressable
                onPress={() => setIsSortModalVisible(false)}
                style={s.modalCloseBtn}
                accessibilityLabel="Close sort bottom sheet"
              >
                <Text style={s.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={s.sortOptionsList}>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortBy === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      setSortBy(opt.id);
                      setIsSortModalVisible(false);
                    }}
                    style={[s.sortOptionRow, isSelected && s.sortOptionRowActive]}
                  >
                    <View style={s.sortOptionIconBox}>
                      <Text style={s.sortOptionEmoji}>{opt.icon}</Text>
                    </View>
                    <View style={s.sortOptionContent}>
                      <Text style={[s.sortOptionLabel, isSelected && s.sortOptionLabelActive]}>
                        {opt.label}
                      </Text>
                      {opt.description ? (
                        <Text style={s.sortOptionDesc}>{opt.description}</Text>
                      ) : null}
                    </View>
                    <View style={[s.sortRadioCircle, isSelected && s.sortRadioCircleActive]}>
                      {isSelected ? <View style={s.sortRadioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── RESPONSIVE FILTERS & SORTING MODAL (Bottom-up on Mobile, Centered on Web) ── */}
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType={isDesktop ? 'fade' : 'slide'}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <Pressable
          onPress={() => setIsFilterModalVisible(false)}
          style={[s.modalOverlay, !isDesktop && s.modalOverlayMobile]}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[s.filterModalCard, !isDesktop && s.filterModalCardMobile]}
          >
            {!isDesktop ? (
              <View {...filterSheetPanResponder.panHandlers} style={s.bottomSheetHandleArea}>
                <View style={s.bottomSheetHandle} />
              </View>
            ) : null}
            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppIcon color={colors.appPrimary} name="wrench" size={18} />
                <Text style={s.modalTitle}>Filters & Sorting</Text>
              </View>
            </View>

            <ScrollView
              style={{ maxHeight: isDesktop ? 480 : 540 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Sort Order Section */}
              <View style={s.filterSection}>
                <Text style={s.filterSectionLabel}>Sort Listings By</Text>
                <View style={s.filterOptionsRow}>
                  {SORT_OPTIONS.map((opt) => {
                    const active = sortBy === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => setSortBy(opt.id)}
                        style={[s.filterOptionPill, active && s.filterOptionPillActive]}
                      >
                        <Text
                          style={[s.filterOptionPillText, active && s.filterOptionPillTextActive]}
                        >
                          {opt.icon} {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Max Budget Filter */}
              <View style={s.filterSection}>
                <Text style={s.filterSectionLabel}>Max Monthly Rent</Text>
                <View style={s.filterOptionsRow}>
                  {[
                    { label: '💵 Any', val: null },
                    { label: '💵 Under $700', val: 700 },
                    { label: '💵 Under $900', val: 900 },
                    { label: '💵 Under $1200', val: 1200 },
                    { label: '💵 Under $1500', val: 1500 },
                  ].map((p) => {
                    const active = filterPriceMax === p.val;
                    return (
                      <Pressable
                        key={p.label}
                        onPress={() => setFilterPriceMax(p.val)}
                        style={[s.filterOptionPill, active && s.filterOptionPillActive]}
                      >
                        <Text
                          style={[s.filterOptionPillText, active && s.filterOptionPillTextActive]}
                        >
                          {p.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Room Type */}
              <View style={s.filterSection}>
                <Text style={s.filterSectionLabel}>Room Type</Text>
                <View style={s.filterOptionsRow}>
                  {[
                    { label: '🏠 All', val: 'All' },
                    { label: '🚪 Private Room', val: 'Private Room' },
                    { label: '👥 Shared 2B2B', val: 'Shared 2B2B' },
                    { label: '🏢 1BHK Studio', val: '1BHK Studio' },
                  ].map((t) => {
                    const active = filterRoomType === t.val;
                    return (
                      <Pressable
                        key={t.val}
                        onPress={() => setFilterRoomType(t.val)}
                        style={[s.filterOptionPill, active && s.filterOptionPillActive]}
                      >
                        <Text
                          style={[s.filterOptionPillText, active && s.filterOptionPillTextActive]}
                        >
                          {t.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Popular Amenities with Icons */}
              <View style={s.filterSection}>
                <Text style={s.filterSectionLabel}>Amenities</Text>
                <View style={s.filterOptionsRow}>
                  {[
                    { id: 'wifi', label: '📶 High-Speed WiFi' },
                    { id: 'bath', label: '🛁 Attached Private Bath' },
                    { id: 'w/d', label: '🧺 In-unit W/D' },
                    { id: 'parking', label: '🚗 Reserved Parking' },
                    { id: 'pool', label: '🏊 Swimming Pool' },
                    { id: 'ac', label: '❄️ Central AC' },
                  ].map((amenity) => {
                    const active = filterSelectedAmenities.includes(amenity.id);
                    return (
                      <Pressable
                        key={amenity.id}
                        onPress={() => toggleAmenityFilter(amenity.id)}
                        style={[s.filterOptionPill, active && s.filterOptionPillActive]}
                      >
                        <Text
                          style={[s.filterOptionPillText, active && s.filterOptionPillTextActive]}
                        >
                          {amenity.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Dietary Preferences */}
              <View style={s.filterSection}>
                <Text style={s.filterSectionLabel}>Dietary Preference</Text>
                <View style={s.filterOptionsRow}>
                  {[
                    { label: '🍽️ All', val: 'All' },
                    { label: '🥦 Veg Only', val: 'Veg Only' },
                    { label: '🍳 Veg / Non-Veg OK', val: 'Non-Veg OK' },
                  ].map((d) => {
                    const active = filterDiet === d.val;
                    return (
                      <Pressable
                        key={d.val}
                        onPress={() => setFilterDiet(d.val)}
                        style={[s.filterOptionPill, active && s.filterOptionPillActive]}
                      >
                        <Text
                          style={[s.filterOptionPillText, active && s.filterOptionPillTextActive]}
                        >
                          {d.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Gender Preference */}
              <View style={s.filterSection}>
                <Text style={s.filterSectionLabel}>Flatmate Gender</Text>
                <View style={s.filterOptionsRow}>
                  {[
                    { label: '👥 Any', val: 'All' },
                    { label: '👩 Female Only', val: 'Female Only' },
                    { label: '👨 Male Only', val: 'Male Only' },
                  ].map((g) => {
                    const active = filterGender === g.val;
                    return (
                      <Pressable
                        key={g.val}
                        onPress={() => setFilterGender(g.val)}
                        style={[s.filterOptionPill, active && s.filterOptionPillActive]}
                      >
                        <Text
                          style={[s.filterOptionPillText, active && s.filterOptionPillTextActive]}
                        >
                          {g.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Verified Hosts Only Switch */}
              <Pressable onPress={() => setFilterVerifiedOnly((prev) => !prev)} style={s.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleLabel}>🛡️ Verified Hosts Only</Text>
                  <Text style={s.toggleSub}>Employer & ID verified Desi hosts</Text>
                </View>
                <View style={[s.switchTrack, filterVerifiedOnly && s.switchTrackActive]}>
                  <View style={[s.switchThumb, filterVerifiedOnly && s.switchThumbActive]} />
                </View>
              </Pressable>
            </ScrollView>

            <View style={s.filterModalActions}>
              <Pressable onPress={resetFilters} style={s.resetFilterBtn}>
                <Text style={s.resetFilterBtnText}>Reset All</Text>
              </Pressable>
              <Pressable onPress={() => setIsFilterModalVisible(false)} style={s.applyFilterBtn}>
                <Text style={s.applyFilterBtnText}>Show {filteredRooms.length} Rooms</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  header: {
    backgroundColor: '#fff',
    borderBottomColor: '#eaedff',
    borderBottomWidth: 1,
    paddingHorizontal: space.x4,
    paddingTop: space.x2,
    paddingBottom: space.x3,
    gap: space.x2,
  },
  headerDesktop: {
    paddingHorizontal: space.x8,
    paddingVertical: space.x4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.x2,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f2f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f2f3ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#eaedff',
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1c28',
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  myRoomsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#431ebe',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  myRoomsBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f2f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  postRoomBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.appPrimary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  postRoomBtnSmallText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f7fb',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#e8eaf6',
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: colors.muted,
    fontSize: 13,
  },
  filterPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(67,30,190,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  filterPillBtnText: {
    color: colors.appPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
    marginTop: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f0f2fa',
    borderRadius: radius.pill,
    padding: 3,
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  segmentBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  segmentBtnTextActive: {
    color: colors.appPrimary,
  },
  toolbarSortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f2fa',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#eaedff',
    flexShrink: 0,
  },
  toolbarSortBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1c28',
  },
  sortModalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: space.x5,
    maxWidth: 440,
    width: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  sortModalCardMobile: {
    width: '100%',
    maxWidth: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 34,
  },
  sortOptionsList: {
    gap: 8,
    marginTop: space.x3,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f8f9fe',
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
  },
  sortOptionRowActive: {
    backgroundColor: 'rgba(67,30,190,0.06)',
    borderColor: colors.appPrimary,
  },
  sortOptionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sortOptionEmoji: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.appPrimary,
  },
  sortOptionContent: {
    flex: 1,
    gap: 2,
  },
  sortOptionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1c28',
  },
  sortOptionLabelActive: {
    color: colors.appPrimary,
  },
  sortOptionDesc: {
    fontSize: 11,
    color: colors.muted,
  },
  sortRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortRadioCircleActive: {
    borderColor: colors.appPrimary,
  },
  sortRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.appPrimary,
  },
  categoryScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#f6f7fb',
    borderWidth: 1,
    borderColor: '#eaedff',
  },
  categoryChipActive: {
    backgroundColor: colors.appPrimary,
    borderColor: colors.appPrimary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  content: {
    padding: space.x4,
    gap: space.x3,
    paddingBottom: 90,
  },
  contentDesktop: {
    maxWidth: 880,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: space.x8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  drawnBoundaryFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  drawnBoundaryFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
    flex: 1,
  },
  drawnBoundaryClearBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  drawnBoundaryClearText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e40af',
  },
  drawnBoundaryMapBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  drawnBoundaryMapText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  zillowFloatingSwitchWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  zillowFloatingSwitchWrapperBottom: {
    bottom: 24,
  },
  zillowFloatingSwitchWrapperTop: {
    top: 14,
  },
  zillowFloatingSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  zillowFloatingSwitchBtnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },
  zillowFloatingSwitchIcon: {
    fontSize: 14,
  },
  zillowFloatingSwitchText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  zillowFloatingSwitchArrow: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1c28',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  filterLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(67,30,190,0.07)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  filterLinkText: {
    color: colors.appPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  roomFeedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: space.x4,
    borderWidth: 1,
    borderColor: '#eaedff',
    gap: space.x3,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  roomCardHeader: {
    flexDirection: 'row',
    gap: space.x3,
  },
  roomCardThumb: {
    width: 86,
    height: 86,
    borderRadius: 14,
    backgroundColor: '#f2f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  roomCardEmoji: {
    fontSize: 36,
  },
  roomCardPriceBadge: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: colors.appPrimary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  roomCardPriceVal: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  roomCardPricePeriod: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: '600',
  },
  roomCardMain: {
    flex: 1,
    gap: 4,
  },
  roomCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomTypeTag: {
    backgroundColor: 'rgba(67,30,190,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roomTypeTagText: {
    color: colors.appPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  saveBtn: {
    padding: 4,
  },
  roomCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1c28',
    lineHeight: 20,
  },
  culturalBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  badgePureVeg: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTextPureVeg: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  badgePrivateBath: {
    backgroundColor: '#00696b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTextPrivateBath: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeFurnished: {
    backgroundColor: '#431ebe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTextFurnished: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  roomCardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomCardLocationText: {
    fontSize: 12,
    color: colors.muted,
    flex: 1,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityChip: {
    backgroundColor: 'rgba(0,105,107,0.07)',
    borderColor: 'rgba(0,105,107,0.18)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  amenityChipText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: '600',
  },
  featureChip: {
    backgroundColor: '#f6f7fb',
    borderColor: '#eaedff',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featureChipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  roomCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.x2,
    borderTopWidth: 1,
    borderTopColor: '#f2f3ff',
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.appPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  hostName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1c28',
  },
  hostMeta: {
    fontSize: 10,
    color: colors.muted,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inquireBtn: {
    backgroundColor: '#f2f3ff',
    borderWidth: 1.5,
    borderColor: colors.appPrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  inquireBtnText: {
    color: colors.appPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  viewDetailsBtn: {
    backgroundColor: colors.appPrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  viewDetailsBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x2,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1c28',
  },
  emptySub: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: space.x2,
    backgroundColor: colors.appPrimary,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
    borderRadius: radius.pill,
  },
  resetBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: colors.appPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    borderRadius: radius.pill,
    shadowColor: colors.appPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },
  fabText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e6ebf5',
  },
  appleMapsControlCluster: {
    position: 'absolute',
    bottom: 20,
    right: 14,
    zIndex: 30,
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  appleMapBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.85)',
  },
  appleMapBtnLast: {
    borderBottomWidth: 0,
  },
  appleMapBtnActive: {
    backgroundColor: 'rgba(238, 242, 255, 0.95)',
  },
  appleMapIcon: {
    fontSize: 16,
  },
  appleMap3DText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  appleMap3DTextActive: {
    color: '#007aff',
  },
  appleMapGpsIcon: {
    fontSize: 18,
    color: '#0f172a',
  },
  appleMapGpsIconActive: {
    color: '#007aff',
  },
  appleMapStyleMenu: {
    position: 'absolute',
    bottom: 20,
    right: 64,
    zIndex: 35,
    width: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
    gap: 4,
  },
  appleMapStyleTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 0.8,
    marginBottom: 2,
    paddingHorizontal: 6,
  },
  appleMapStyleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  appleMapStyleOptionSelected: {
    backgroundColor: '#f2f3ff',
  },
  appleMapStyleIcon: {
    fontSize: 16,
  },
  appleMapStyleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  appleMapStyleTextSelected: {
    color: '#007aff',
  },
  appleMapStyleDesc: {
    fontSize: 10,
    color: colors.muted,
  },
  appleMapStyleCheck: {
    fontSize: 13,
    fontWeight: '800',
    color: '#007aff',
  },
  mapCanvas: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#eaf0fa',
    overflow: 'hidden',
  },
  mapCorridorLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c9d4ea',
  },
  mapCorridorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5b6480',
  },
  mapRoadwayMopac: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '38%',
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    transform: [{ rotate: '12deg' }],
  },
  mapRoadwayIH35: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '65%',
    width: 7,
    backgroundColor: 'rgba(255,255,255,0.7)',
    transform: [{ rotate: '8deg' }],
  },
  mapPin: {
    position: 'absolute',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.appPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinSelected: {
    backgroundColor: colors.appPrimary,
    borderColor: '#fff',
    transform: [{ scale: 1.15 }],
    zIndex: 10,
  },
  mapPinText: {
    color: colors.appPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  mapPinTextSelected: {
    color: '#fff',
  },
  mapPinPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.appPrimary,
    opacity: 0.5,
  },
  cardCloseBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  collapsedCardTriggerBtn: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    zIndex: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  collapsedCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cardDragGrip: {
    fontSize: 12,
    color: '#94a3b8',
    letterSpacing: -1,
  },
  collapsedCardIcon: {
    fontSize: 16,
  },
  collapsedCardText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.appPrimary,
  },
  collapsedCardChevron: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  floatingMapCardContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 25,
  },
  floatingMapCard: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: space.x3,
    paddingTop: space.x4,
    maxWidth: 520,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#eaedff',
  },
  cardDragBarContainer: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  floatingMapCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
  },
  floatingThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f2f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingEmoji: {
    fontSize: 32,
  },
  floatingPriceTag: {
    position: 'absolute',
    bottom: 3,
    backgroundColor: colors.appPrimary,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  floatingPriceVal: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  floatingInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  floatingTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingType: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.appPrimary,
  },
  floatingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1c28',
  },
  floatingLocation: {
    fontSize: 11,
    color: colors.muted,
  },
  floatingBath: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.teal,
    marginLeft: 6,
  },
  floatingCtaRow: {
    marginTop: 4,
  },
  floatingDetailsBtn: {
    backgroundColor: 'rgba(67,30,190,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  floatingDetailsLink: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.appPrimary,
  },
  floatingToggleBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.appPrimary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 20,
  },
  floatingToggleBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,18,30,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.x4,
  },
  modalOverlayMobile: {
    justifyContent: 'flex-end',
    padding: 0,
  },
  bottomSheetHandleArea: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#d5dafc',
    alignSelf: 'center',
    marginBottom: 8,
  },
  cityModalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: space.x5,
    width: '100%',
    maxWidth: 500,
    gap: space.x3,
  },
  citySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    gap: 8,
    marginVertical: 4,
  },
  citySearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    padding: 0,
  },
  citySearchClearText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  citySectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  citySelectPill: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  citySelectPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#431ebe',
  },
  cityEmptyResults: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityEmptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  cityModalCardMobile: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 32,
    minHeight: 460,
    maxHeight: '85%',
  },
  cityModalScrollView: {
    flex: 1,
    minHeight: 240,
    maxHeight: 380,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1c28',
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: -4,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f2f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  cityOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.x3,
    paddingHorizontal: space.x3,
    borderRadius: 12,
    marginBottom: 4,
  },
  cityOptionRowActive: {
    backgroundColor: 'rgba(67,30,190,0.06)',
  },
  cityOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
    flex: 1,
  },
  cityOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1c28',
  },
  cityOptionNameActive: {
    color: colors.appPrimary,
  },
  cityOptionLandmarks: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  cityCountPill: {
    backgroundColor: '#f2f3ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  cityCountPillActive: {
    backgroundColor: colors.appPrimary,
  },
  cityCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  cityCountTextActive: {
    color: '#fff',
  },
  filterModalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: space.x5,
    width: '100%',
    maxWidth: 580,
    gap: space.x4,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  filterModalCardMobile: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  filterSection: {
    gap: 8,
    marginBottom: space.x4,
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a1c28',
    letterSpacing: -0.2,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionPill: {
    paddingHorizontal: space.x3,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionPillActive: {
    backgroundColor: colors.appPrimary,
    borderColor: colors.appPrimary,
  },
  filterOptionPillText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterOptionPillTextActive: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.x2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toggleLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleSub: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: colors.appPrimary,
    borderColor: colors.appPrimary,
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  filterModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
    paddingTop: space.x2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetFilterBtn: {
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  resetFilterBtnText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  applyFilterBtn: {
    flex: 1,
    backgroundColor: colors.appPrimary,
    borderRadius: radius.pill,
    paddingVertical: space.x3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFilterBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  dualPaneContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  dualPaneLeft: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#eaedff',
    backgroundColor: '#fff',
  },
  dualPaneRight: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e6ebf5',
  },
  mapContainerDualPane: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentDualPane: {
    paddingHorizontal: space.x4,
    width: '100%',
  },
  dualPaneCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.x3,
  },
  roomFeedCardDualPane: {
    flex: 1,
    minWidth: 260,
  },
  roomCardContainerActiveDualPane: {
    borderColor: '#431ebe',
    borderWidth: 2,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  searchThisAreaWrapper: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    zIndex: 20,
  },
  searchThisAreaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#431ebe',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 6,
  },
  searchThisAreaIcon: {
    fontSize: 14,
  },
  searchThisAreaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#431ebe',
  },
  // ─── CARD VIEW STYLES ────────────────────────────────────────────────────────
  roomCardContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#eaedff',
    overflow: 'hidden',
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: space.x3,
  },
  roomCardHero: {
    height: 140,
    backgroundColor: '#f2f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#eaedff',
  },
  roomCardHeroGraphic: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomCardHeroEmoji: {
    fontSize: 52,
  },
  roomCardHeroTypeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(26,28,40,0.72)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  roomCardHeroTypeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  roomCardHeroSaveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  roomCardHeroPriceBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: colors.appPrimary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  roomCardHeroPriceVal: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  roomCardHeroPricePeriod: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 1,
  },
  roomCardHeroVerifiedBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  roomCardHeroVerifiedText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '700',
  },
  roomCardBody: {
    padding: space.x4,
    gap: space.x3,
  },

  // ─── LIST VIEW STYLES ────────────────────────────────────────────────────────
  roomListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eaedff',
    gap: 10,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 8,
  },
  roomListThumb: {
    width: 66,
    height: 66,
    borderRadius: 12,
    backgroundColor: '#f2f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  roomListEmoji: {
    fontSize: 28,
  },
  roomListPriceBadge: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: colors.appPrimary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  roomListPriceVal: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  roomListPricePeriod: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 8,
    fontWeight: '600',
  },
  roomListMain: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  roomListTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomListLocationText: {
    fontSize: 11,
    color: colors.muted,
    flex: 1,
  },
  roomListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1c28',
    lineHeight: 18,
  },
  roomListBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  badgePureVegSmall: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeTextPureVegSmall: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  badgePrivateBathSmall: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeTextPrivateBathSmall: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  badgeFurnishedSmall: {
    backgroundColor: '#d97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeTextFurnishedSmall: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  featureChipSmall: {
    backgroundColor: '#f2f3ff',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  featureChipTextSmall: {
    fontSize: 9,
    color: '#431ebe',
    fontWeight: '600',
  },
  roomListRightCol: {
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
    flexShrink: 0,
  },
  roomListSaveBtn: {
    padding: 4,
  },
  roomListViewArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f2f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
