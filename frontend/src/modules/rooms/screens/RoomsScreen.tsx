import { color as baseColors, radius, space } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { Link, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { listRoomListings, saveRoom, unsaveRoom } from '@/modules/rooms/api';
import type { RoomListing } from '@/modules/rooms/types';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

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
  landmarks: string[];
};

const CITIES: CityOption[] = [
  {
    id: 'austin',
    name: 'Austin, TX',
    landmarks: ['Domain Northside', 'Apple Riata', 'UT Austin', 'Round Rock'],
  },
  {
    id: 'dfw',
    name: 'Dallas-Fort Worth, TX',
    landmarks: ['Irving', 'Plano', 'Frisco', 'Richardson'],
  },
  {
    id: 'houston',
    name: 'Houston, TX',
    landmarks: ['Sugar Land', 'Katy', 'Medical Center', 'Galleria'],
  },
  {
    id: 'bayarea',
    name: 'Bay Area, CA',
    landmarks: ['Sunnyvale', 'Fremont', 'Santa Clara', 'San Jose'],
  },
  { id: 'seattle', name: 'Seattle, WA', landmarks: ['Bellevue', 'Redmond', 'South Lake Union'] },
  {
    id: 'jersey',
    name: 'Jersey City / NYC',
    landmarks: ['Journal Square', 'Newport', 'Edison, NJ'],
  },
];

type ExtendedRoom = RoomListing & {
  mapX: number; // percentage across map
  mapY: number; // percentage down map
  verifiedHost: boolean;
};

const filterCategories = [
  { id: 'all', label: 'All' },
  { id: 'veg', label: 'Pure Veg Only' },
  { id: 'bath', label: 'Private Bath' },
  { id: 'female', label: 'Female Only' },
  { id: 'under800', label: 'Under $800' },
  { id: 'furnished', label: 'Furnished' },
];

type SortOption = 'recommended' | 'price_low' | 'price_high' | 'newest';

const SORT_OPTIONS: { id: SortOption; label: string; icon: string }[] = [
  { id: 'recommended', label: 'Recommended', icon: '✦' },
  { id: 'price_low', label: 'Price: Low to High', icon: '↑' },
  { id: 'price_high', label: 'Price: High to Low', icon: '↓' },
  { id: 'newest', label: 'Newest First', icon: '⚡' },
];

export function RoomsScreen({ screenId }: RoomsScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isDualPane = width >= 1024;
  const insets = useSafeAreaInsets();

  // State
  const [selectedCity, setSelectedCity] = useState<CityOption>(CITIES[0]);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(screenId === 'filters');
  const [viewMode, setViewMode] = useState<'list' | 'map'>(screenId === 'map' ? 'map' : 'list');
  const [selectedPinRoomId, setSelectedPinRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isFilterModalVisible) {
        setIsFilterModalVisible(false);
        return true;
      }
      if (isCityModalVisible) {
        setIsCityModalVisible(false);
        return true;
      }
      if (viewMode === 'map' && screenId !== 'map') {
        setViewMode('list');
        return true;
      }
      router.back();
      return true;
    });
    return () => sub.remove();
  }, [isFilterModalVisible, isCityModalVisible, viewMode, screenId]);

  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  const saveMutation = useMutation({
    mutationFn: async ({ roomId, isSaved }: { roomId: string; isSaved: boolean }) => {
      if (isSaved) {
        await unsaveRoom(roomId);
      } else {
        await saveRoom(roomId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', 'favorites'] });
    },
  });

  // Filter state for modal
  const [filterPriceMax, setFilterPriceMax] = useState<number | null>(null);
  const [filterRoomType, setFilterRoomType] = useState<string>('All');
  const [filterDiet, setFilterDiet] = useState<string>('All');
  const [filterGender, setFilterGender] = useState<string>('All');
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterSelectedAmenities, setFilterSelectedAmenities] = useState<string[]>([]);

  // Query real API listings directly from backend / Supabase
  const { data: listings, isLoading } = useQuery({
    queryKey: ['rooms', 'listings'],
    queryFn: () => listRoomListings(),
    retry: 1,
  });

  // Transform backend listings into map-enabled extended listings
  const rawListings: ExtendedRoom[] = useMemo(() => {
    const list = listings ?? [];
    return list.map((l, i) => {
      let mapX = 50;
      let mapY = 50;
      if (l.latitude && l.longitude) {
        // Austin bounds: lat 30.20 to 30.55, lng -97.85 to -97.65
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
  }, [listings]);

  // Active pin selection defaults to first listing once loaded
  const activePinRoom = useMemo(() => {
    if (selectedPinRoomId) {
      const found = rawListings.find((r) => r.id === selectedPinRoomId);
      if (found) return found;
    }
    return rawListings[0] ?? null;
  }, [selectedPinRoomId, rawListings]);

  // Filter and sort listings
  let filteredRooms = rawListings.filter((room) => {
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

  const toggleSave = (id: string, currentlySaved: boolean) => {
    setSavedIds((prev) => ({ ...prev, [id]: !currentlySaved }));
    saveMutation.mutate({ roomId: id, isSaved: currentlySaved });
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

  return (
    <SafeAreaView style={[s.safeArea, { paddingBottom: Math.max(insets.bottom, 0) }]}>
      {/* ─── Top Header ───────────────────────────────────────────────────────── */}
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
            <Text style={s.locationTitle}>
              {selectedCity.name} ·{' '}
              {rawListings.length > 0 ? `${rawListings.length} Active` : 'Active Hub'}
            </Text>
            <AppIcon color={colors.muted} name="chevron-down" size={14} />
          </Pressable>

          <View style={s.headerActions}>
            <Link href="/rooms/saved" asChild>
              <Pressable accessibilityLabel="Saved Rooms" style={StyleSheet.flatten(s.iconBtn)}>
                <AppIcon color={colors.appPrimary} name="star" size={18} />
              </Pressable>
            </Link>
            <Link href="/rooms/create-listing" asChild>
              <Pressable
                accessibilityLabel="Post a Room"
                style={StyleSheet.flatten(s.postRoomBtnSmall)}
              >
                <AppIcon color="#fff" name="plus" size={16} />
                <Text style={s.postRoomBtnSmallText}>Post Room</Text>
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
            <Text style={s.filterPillBtnText}>Filters</Text>
          </Pressable>
        </View>

        {/* View Mode (List vs Map) & Sort Bar */}
        <View style={s.toolbarRow}>
          {/* Segmented control: List vs Map */}
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
              onPress={() => setViewMode('map')}
              style={[s.segmentBtn, viewMode === 'map' && s.segmentBtnActive]}
            >
              <Text style={[s.segmentBtnText, viewMode === 'map' && s.segmentBtnTextActive]}>
                🗺️ Map View
              </Text>
            </Pressable>
          </View>

          {/* Quick Sort Options with Icons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.sortScroll}
          >
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => setSortBy(opt.id)}
                style={[s.sortChip, sortBy === opt.id && s.sortChipActive]}
              >
                <Text style={[s.sortChipText, sortBy === opt.id && s.sortChipTextActive]}>
                  {opt.icon} {opt.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
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
        const renderMapView = () => (
          <View style={[s.mapContainer, isDualPane && s.mapContainerDualPane]}>
            <View style={s.mapCanvas}>
              {/* Tech corridor area labels */}
              <View style={[s.mapCorridorLabel, { top: '15%', right: '12%' }]}>
                <Text style={s.mapCorridorText}>Round Rock Tech</Text>
              </View>
              <View style={[s.mapCorridorLabel, { top: '26%', left: '18%' }]}>
                <Text style={s.mapCorridorText}>Domain Northside / Apple</Text>
              </View>
              <View style={[s.mapCorridorLabel, { top: '56%', left: '35%' }]}>
                <Text style={s.mapCorridorText}>UT Austin / Downtown</Text>
              </View>

              {/* Stylized highway / roadway guides */}
              <View style={s.mapRoadwayMopac} />
              <View style={s.mapRoadwayIH35} />

              {/* Dynamic Map Price Pins from Backend Listings */}
              {filteredRooms.map((room) => {
                const isSelected = activePinRoom?.id === room.id;
                return (
                  <Pressable
                    key={room.id}
                    onPress={() => setSelectedPinRoomId(room.id)}
                    style={[
                      s.mapPin,
                      { left: `${room.mapX}%`, top: `${room.mapY}%` },
                      isSelected && s.mapPinSelected,
                    ]}
                  >
                    <Text style={[s.mapPinText, isSelected && s.mapPinTextSelected]}>
                      ${room.price}
                    </Text>
                    {isSelected ? <View style={s.mapPinPulse} /> : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Floating List View button to switch back to /rooms/search (only on single-pane) */}
            {!isDualPane && (
              <Pressable
                onPress={() => {
                  setViewMode('list');
                  router.push('/rooms/search' as Href);
                }}
                style={s.floatingToggleBtn}
                accessibilityLabel="Switch to List View"
              >
                <AppIcon color="#fff" name="compass" size={16} />
                <Text style={s.floatingToggleBtnText}>List View</Text>
              </Pressable>
            )}

            {/* Floating Selected Room Card at bottom of map */}
            {activePinRoom ? (
              <View style={s.floatingMapCardContainer}>
                <Pressable
                  onPress={() => router.push(`/rooms/${activePinRoom.id}` as Href)}
                  style={s.floatingMapCard}
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
            ) : null}
          </View>
        );

        const renderListView = () => (
          <ScrollView
            contentContainerStyle={[
              s.content,
              isDesktop && !isDualPane && s.contentDesktop,
              isDualPane && s.contentDualPane,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section info */}
            <View style={s.sectionHeader}>
              <View>
                <Text style={s.sectionTitle}>Available Rooms ({filteredRooms.length})</Text>
                <Text style={s.sectionSub}>Live listings from Supabase in {selectedCity.name}</Text>
              </View>
              <Pressable onPress={() => setIsFilterModalVisible(true)} style={s.filterLinkBtn}>
                <AppIcon color={colors.appPrimary} name="wrench" size={13} />
                <Text style={s.filterLinkText}>All Filters</Text>
              </Pressable>
            </View>

            {/* Room Listings Feed */}
            {isLoading ? (
              <View style={s.loadingBox}>
                <ActivityIndicator size="large" color={colors.appPrimary} />
                <Text style={s.loadingText}>Fetching live room listings from Supabase...</Text>
              </View>
            ) : filteredRooms.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyEmoji}>🔍</Text>
                <Text style={s.emptyTitle}>No rooms match your filters</Text>
                <Text style={s.emptySub}>
                  Try selecting a different filter or reset all filters to view all available rooms.
                </Text>
                <Pressable onPress={resetFilters} style={s.resetFilterBtn}>
                  <Text style={s.resetFilterBtnText}>Reset All Filters</Text>
                </Pressable>
              </View>
            ) : (
              <View style={isDualPane ? s.dualPaneCardGrid : undefined}>
                {filteredRooms.map((room) => {
                  const isSaved =
                    savedIds[room.id] !== undefined ? savedIds[room.id] : room.savedByViewer;
                  return (
                    <Pressable
                      key={room.id}
                      onPress={() => {
                        if (isDualPane) {
                          setSelectedPinRoomId(room.id);
                        }
                        router.push(`/rooms/${room.id}` as Href);
                      }}
                      style={[s.roomFeedCard, isDualPane && s.roomFeedCardDualPane]}
                    >
                      <View style={s.roomCardHeader}>
                        <View style={s.roomCardThumb}>
                          <Text style={s.roomCardEmoji}>🛏️</Text>
                          <View style={s.roomCardPriceBadge}>
                            <Text style={s.roomCardPriceVal}>${room.price}</Text>
                            <Text style={s.roomCardPricePeriod}>/mo</Text>
                          </View>
                        </View>
                        <View style={s.roomCardMain}>
                          <View style={s.roomCardTopRow}>
                            <View style={s.roomTypeTag}>
                              <Text style={s.roomTypeTagText}>🚪 {room.roomType}</Text>
                            </View>
                            <Pressable
                              onPress={(e) => {
                                e.stopPropagation();
                                toggleSave(room.id, Boolean(isSaved));
                              }}
                              style={s.saveBtn}
                              accessibilityLabel={isSaved ? 'Unsave room' : 'Save room'}
                            >
                              <AppIcon
                                color={isSaved ? '#e02424' : colors.muted}
                                name="star"
                                size={18}
                              />
                            </Pressable>
                          </View>

                          <Text style={s.roomCardTitle} numberOfLines={2}>
                            {room.title}
                          </Text>

                          <View style={s.roomCardLocationRow}>
                            <AppIcon color={colors.muted} name="map" size={12} />
                            <Text style={s.roomCardLocationText} numberOfLines={1}>
                              {room.broadLocation}
                            </Text>
                          </View>
                        </View>
                      </View>

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
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>
        );

        if (isDualPane) {
          return (
            <View style={s.dualPaneContainer}>
              <View style={s.dualPaneLeft}>{renderListView()}</View>
              <View style={s.dualPaneRight}>{renderMapView()}</View>
            </View>
          );
        }

        return viewMode === 'map' ? renderMapView() : renderListView();
      })()}

      {/* ─── Floating Action Button: Post Room ─────────────────────────────────── */}
      <Link href="/rooms/create-listing" asChild>
        <Pressable
          accessibilityLabel="Post a room"
          accessibilityRole="button"
          style={StyleSheet.flatten(s.fab)}
        >
          <AppIcon color="#fff" name="plus" size={20} />
          <Text style={s.fabText}>Post Room</Text>
        </Pressable>
      </Link>

      {/* ─── City Selector Modal ──────────────────────────────────────────────── */}
      <Modal visible={isCityModalVisible} transparent animationType={isDesktop ? 'fade' : 'slide'}>
        <Pressable
          onPress={() => setIsCityModalVisible(false)}
          style={[s.modalOverlay, !isDesktop && s.modalOverlayMobile]}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[s.cityModalCard, !isDesktop && s.cityModalCardMobile]}
          >
            {!isDesktop ? <View style={s.bottomSheetHandle} /> : null}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Choose Metro Area</Text>
              <Pressable onPress={() => setIsCityModalVisible(false)} style={s.modalCloseBtn}>
                <Text style={s.modalCloseText}>✕</Text>
              </Pressable>
            </View>
            <Text style={s.modalSubtitle}>Discover verified flatmates & housing in your metro</Text>

            <ScrollView style={{ maxHeight: 360 }}>
              {CITIES.map((city) => {
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
                        <Text style={[s.cityOptionName, isSelected && s.cityOptionNameActive]}>
                          {city.name}
                        </Text>
                        <Text style={s.cityOptionLandmarks}>{city.landmarks.join(' • ')}</Text>
                      </View>
                    </View>
                    <View style={[s.cityCountPill, isSelected && s.cityCountPillActive]}>
                      <Text style={[s.cityCountText, isSelected && s.cityCountTextActive]}>
                        {(() => {
                          const cityNamePrefix = city.name.split(',')[0].toLowerCase();
                          const count = rawListings.filter((r) =>
                            r.broadLocation?.toLowerCase().includes(cityNamePrefix),
                          ).length;
                          return count > 0 ? `${count} active` : 'Active Hub';
                        })()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── RESPONSIVE FILTERS & SORTING MODAL (Bottom-up on Mobile, Centered on Web) ── */}
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType={isDesktop ? 'fade' : 'slide'}
      >
        <View style={[s.modalOverlay, !isDesktop && s.modalOverlayMobile]}>
          <View style={[s.filterModalCard, !isDesktop && s.filterModalCardMobile]}>
            {!isDesktop ? <View style={s.bottomSheetHandle} /> : null}
            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppIcon color={colors.appPrimary} name="wrench" size={18} />
                <Text style={s.modalTitle}>Filters & Sorting</Text>
              </View>
              <Pressable onPress={() => setIsFilterModalVisible(false)} style={s.modalCloseBtn}>
                <Text style={s.modalCloseText}>✕</Text>
              </Pressable>
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
          </View>
        </View>
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
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f2f3ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#eaedff',
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1c28',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f2f3ff',
    alignItems: 'center',
    justifyContent: 'center',
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
  sortScroll: {
    gap: 6,
    paddingRight: space.x2,
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#f6f7fb',
    borderWidth: 1,
    borderColor: '#eaedff',
  },
  sortChipActive: {
    backgroundColor: 'rgba(67,30,190,0.08)',
    borderColor: colors.appPrimary,
  },
  sortChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  sortChipTextActive: {
    color: colors.appPrimary,
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
    elevation: 6,
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
  floatingMapCardContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  floatingMapCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: space.x3,
    maxWidth: 520,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#eaedff',
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
  bottomSheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#d5dafc',
    alignSelf: 'center',
    marginBottom: 12,
  },
  cityModalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: space.x5,
    width: '100%',
    maxWidth: 500,
    gap: space.x3,
  },
  cityModalCardMobile: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 32,
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
});
