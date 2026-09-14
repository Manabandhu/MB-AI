import { color as baseColors, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
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

import { listRideOffers } from '@/modules/rides/api';
import type { RideOffer } from '@/modules/rides/types';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const colors = {
  ...baseColors,
  appPrimary: '#431ebe',
  primaryDim: '#32149b',
  primaryContainer: '#5b3fd6',
  surfaceContainer: '#eaedff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainerLowest: '#ffffff',
  inkSecondary: baseColors.muted,
  warm: '#ff7e33',
  teal: '#00696b',
  tealSoft: 'rgba(0,105,107,0.08)',
  indigoSoft: 'rgba(67,30,190,0.07)',
  orangeSoft: 'rgba(255,126,51,0.10)',
};

export type RidesScreenId =
  | 'home'
  | 'search'
  | 'map'
  | 'filters'
  | 'offer'
  | 'request'
  | 'saved'
  | 'mine'
  | 'history'
  | 'details'
  | 'manage'
  | 'seat-requests'
  | 'participants'
  | 'rate';

type RidesScreenProps = {
  screenId?: RidesScreenId;
};

// ─── City Options ─────────────────────────────────────────────────────────────
type CityOption = {
  id: string;
  name: string;
  count: number;
  corridors: string[];
};

const CITIES: CityOption[] = [
  {
    id: 'austin',
    name: 'Austin, TX',
    count: 240,
    corridors: [
      'Brushy Creek ➔ Apple Riata',
      'Avery Ranch ➔ Google Hub',
      'Domain ➔ DFW',
      'SoCo ➔ UT Austin',
    ],
  },
  {
    id: 'dfw',
    name: 'Dallas-Fort Worth, TX',
    count: 410,
    corridors: ['Frisco ➔ Las Colinas', 'Plano ➔ Downtown Dallas', 'Irving ➔ Legacy West'],
  },
  {
    id: 'houston',
    name: 'Houston, TX',
    count: 320,
    corridors: ['Katy ➔ Energy Corridor', 'Sugar Land ➔ Medical Center'],
  },
  {
    id: 'bayarea',
    name: 'Bay Area, CA',
    count: 680,
    corridors: ['Fremont ➔ Sunnyvale', 'San Jose ➔ Cupertino Apple Park'],
  },
  {
    id: 'seattle',
    name: 'Seattle, WA',
    count: 390,
    corridors: ['Bellevue ➔ South Lake Union', 'Redmond ➔ Downtown Seattle'],
  },
];

// ─── Enhanced Ride Item Interface ─────────────────────────────────────────────
export type EnrichedRide = RideOffer & {
  driverName: string;
  driverAvatar?: string;
  driverEmployer: string;
  driverRating: number;
  ridesGiven: number;
  verifiedDriver: boolean;
  vehicleModel: string;
  vehicleTag: string;
  departureTimeDisplay: string;
  returnTimeDisplay?: string;
  vibes: string[];
  commuteType: 'daily' | 'intercity' | 'weekend';
  mapX: number; // percentage across map
  mapY: number; // percentage down map
};

const filterCategories = [
  { id: 'all', label: '🚗 All Carpools' },
  { id: 'notolls', label: '🚫 No Tolls' },
  { id: 'apple', label: '🏢 Apple / Riata' },
  { id: 'google', label: '🔍 Google Downtown' },
  { id: 'daily', label: '🔁 Daily Commute' },
  { id: 'intercity', label: '🛣️ Intercity (DFW / Houston)' },
  { id: 'women', label: '👩 Women Only' },
  { id: 'ev', label: '⚡ Tesla / EV' },
  { id: 'luggage', label: '🧳 Luggage Space' },
  { id: 'veg', label: '🥟 Pure Veg' },
];

type SortOption = 'recommended' | 'price_low' | 'seats_most' | 'earliest';

const SORT_OPTIONS: { id: SortOption; label: string; icon: string }[] = [
  { id: 'recommended', label: 'Recommended', icon: '✦' },
  { id: 'price_low', label: 'Contribution: Low to High', icon: '↑' },
  { id: 'seats_most', label: 'Seats: Most Available', icon: '👥' },
  { id: 'earliest', label: 'Departure: Earliest', icon: '⚡' },
];

export function RidesScreen({ screenId = 'home' }: RidesScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isLargeDesktop = width >= 1024;
  const insets = useSafeAreaInsets();

  // Search & Filter State
  const [selectedCity, setSelectedCity] = useState<CityOption>(CITIES[0]);
  const [showCityModal, setShowCityModal] = useState(false);
  const [pickupQuery, setPickupQuery] = useState('');
  const [dropoffQuery, setDropoffQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [viewMode, setViewMode] = useState<'list' | 'map'>(screenId === 'map' ? 'map' : 'list');
  const [showFilterModal, setShowFilterModal] = useState(screenId === 'filters');

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showFilterModal) {
        setShowFilterModal(false);
        return true;
      }
      if (showCityModal) {
        setShowCityModal(false);
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
  }, [showFilterModal, showCityModal, viewMode, screenId]);

  // Filter selections
  const [filterWomenOnly, setFilterWomenOnly] = useState(false);
  const [filterEvOnly, setFilterEvOnly] = useState(false);
  const [filterDailyOnly, setFilterDailyOnly] = useState(false);
  const [filterNoTolls, _setFilterNoTolls] = useState(false);

  // Active highlighted ride on map
  const [selectedMapRideId, setSelectedMapRideId] = useState<string | null>(null);

  // Query Backend Rides API
  const {
    data: rawRides,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['rides', 'offers', pickupQuery, dropoffQuery, activeCategory, filterNoTolls],
    queryFn: () =>
      listRideOffers({
        origin: pickupQuery || undefined,
        destination: dropoffQuery || undefined,
        avoidTolls: activeCategory === 'notolls' || filterNoTolls ? true : undefined,
      }),
  });

  // Enrich raw rides with driver and presentation data
  const enrichedRides: EnrichedRide[] = useMemo(() => {
    if (!rawRides || rawRides.length === 0) return [];
    return rawRides.map((ride, index) => {
      const depTime = ride.departureAt
        ? new Date(ride.departureAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '8:30 AM';
      const costNum = parseFloat(String(ride.contribution || '0').replace(/[^0-9.]/g, '')) || 6;

      return {
        ...ride,
        driverName: ride.driverId
          ? `Verified Driver (${ride.driverId.slice(0, 6)})`
          : 'Verified Driver',
        driverAvatar: undefined,
        driverEmployer: 'Verified Member',
        driverRating: 4.9,
        ridesGiven: 15 + ((index * 3) % 20),
        verifiedDriver: true,
        vehicleModel: 'Commuter Carpool',
        vehicleTag: 'Verified Carpool',
        departureTimeDisplay: depTime,
        returnTimeDisplay: undefined,
        vibes: ['Community Carpool 🚗', 'Zero Brokerage'],
        commuteType: costNum > 25 ? 'intercity' : 'daily',
        mapX: 30 + ((index * 15) % 50),
        mapY: 25 + ((index * 18) % 55),
      };
    });
  }, [rawRides]);

  // Apply Client Filters & Sorting
  const filteredRides = useMemo(() => {
    return enrichedRides
      .filter((ride) => {
        // Category filter
        if (activeCategory === 'apple' && !ride.destinationArea.toLowerCase().includes('apple'))
          return false;
        if (activeCategory === 'google' && !ride.destinationArea.toLowerCase().includes('google'))
          return false;
        if (activeCategory === 'daily' && ride.commuteType !== 'daily') return false;
        if (activeCategory === 'intercity' && ride.commuteType !== 'intercity') return false;
        if (
          activeCategory === 'women' &&
          !ride.vibes.some((v) => v.toLowerCase().includes('women'))
        )
          return false;
        if (
          activeCategory === 'ev' &&
          !ride.vehicleModel.toLowerCase().includes('ev') &&
          !ride.vehicleModel.toLowerCase().includes('tesla')
        )
          return false;
        if (
          activeCategory === 'luggage' &&
          !ride.vibes.some(
            (v) => v.toLowerCase().includes('luggage') || v.toLowerCase().includes('trunk'),
          )
        )
          return false;
        if (activeCategory === 'veg' && !ride.vibes.some((v) => v.toLowerCase().includes('veg')))
          return false;

        // Modal Filters
        if (filterWomenOnly && !ride.vibes.some((v) => v.toLowerCase().includes('women')))
          return false;
        if (
          filterEvOnly &&
          !ride.vehicleModel.toLowerCase().includes('ev') &&
          !ride.vehicleModel.toLowerCase().includes('tesla')
        )
          return false;
        if (filterDailyOnly && ride.commuteType !== 'daily' && !ride.isRecurring) return false;
        if (
          (activeCategory === 'notolls' || filterNoTolls) &&
          ride.tollPreference &&
          ride.tollPreference !== 'AVOID_TOLLS'
        )
          return false;

        return true;
      })
      .sort((a, b) => {
        const priceA = parseFloat(a.contribution.replace(/[^0-9.]/g, '')) || 0;
        const priceB = parseFloat(b.contribution.replace(/[^0-9.]/g, '')) || 0;
        if (sortBy === 'price_low') return priceA - priceB;
        if (sortBy === 'seats_most') return b.seatsAvailable - a.seatsAvailable;
        if (sortBy === 'earliest')
          return new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime();
        return b.driverRating - a.driverRating;
      });
  }, [
    enrichedRides,
    activeCategory,
    filterWomenOnly,
    filterEvOnly,
    filterDailyOnly,
    filterNoTolls,
    sortBy,
  ]);

  function handleSwapRoute() {
    const temp = pickupQuery;
    setPickupQuery(dropoffQuery);
    setDropoffQuery(temp);
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 0) }]}
    >
      {/* ── Top App Bar ────────────────────────────────────────────────────────── */}
      <View style={[styles.topBar, isDesktop && styles.topBarDesktop]}>
        <View style={styles.topBarLeft}>
          <Pressable
            accessibilityLabel="ManaBandhu Home"
            accessibilityRole="button"
            onPress={() => router.push('/')}
            style={styles.logoBadge}
          >
            <View style={styles.logoCircle}>
              <AppIcon color={colors.surfaceContainerLowest} name="car" size={20} />
            </View>
          </Pressable>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandTitle}>ManaBandhu</Text>
              <View style={styles.moduleBadge}>
                <Text style={styles.moduleBadgeText}>Rides</Text>
              </View>
            </View>
            {/* City Selector Pill */}
            <Pressable
              accessibilityLabel={`Select City: ${selectedCity.name}`}
              accessibilityRole="button"
              onPress={() => setShowCityModal(true)}
              style={styles.citySelector}
            >
              <AppIcon color={colors.appPrimary} name="compass" size={13} />
              <Text numberOfLines={1} style={styles.cityName}>
                {selectedCity.name} · {selectedCity.count} Daily Carpools
              </Text>
              <AppIcon color={colors.inkSecondary} name="chevron-down" size={13} />
            </Pressable>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <Link asChild href={'/rides/saved' as Href}>
            <Pressable
              accessibilityLabel="Saved Rides"
              accessibilityRole="button"
              style={styles.iconBtn}
            >
              <AppIcon color={colors.ink} name="star" size={22} />
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>3</Text>
              </View>
            </Pressable>
          </Link>
          <Link asChild href={'/rides/offer' as Href}>
            <Pressable
              accessibilityLabel="Offer Ride"
              accessibilityRole="button"
              style={styles.offerRideBtn}
            >
              <AppIcon color={colors.surfaceContainerLowest} name="plus" size={18} />
              <Text style={styles.offerRideBtnText}>Offer Ride</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.mainContainer, isDesktop && styles.mainContainerDesktop]}>
          {/* ── Route Search Card ───────────────────────────────────────────── */}
          <View style={styles.searchCard}>
            <View style={styles.searchInputsGroup}>
              {/* Origin Field */}
              <View style={styles.searchInputRow}>
                <View style={styles.originIndicator} />
                <View style={styles.inputInner}>
                  <Text style={styles.inputLabel}>Pickup Origin</Text>
                  <TextInput
                    accessibilityLabel="Pickup origin input"
                    onChangeText={setPickupQuery}
                    placeholder="Pickup origin (e.g. Brushy Creek / Domain)"
                    placeholderTextColor="#9ca3af"
                    style={styles.textInput}
                    value={pickupQuery}
                  />
                </View>
                {pickupQuery.length > 0 ? (
                  <Pressable onPress={() => setPickupQuery('')} style={styles.inputActionBtn}>
                    <Text style={{ fontSize: 13, color: colors.inkSecondary }}>✕</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => setPickupQuery('Brushy Creek, Round Rock')}
                    style={styles.inputActionBtn}
                  >
                    <AppIcon color={colors.appPrimary} name="compass" size={18} />
                  </Pressable>
                )}
              </View>

              {/* Swap Route Button */}
              <View style={styles.swapContainer}>
                <Pressable
                  accessibilityLabel="Swap origin and destination"
                  accessibilityRole="button"
                  onPress={handleSwapRoute}
                  style={styles.swapBtn}
                >
                  <Text style={{ fontSize: 15, color: colors.appPrimary, fontWeight: '700' }}>
                    ⇅
                  </Text>
                </Pressable>
              </View>

              {/* Destination Field */}
              <View style={styles.searchInputRow}>
                <AppIcon color={colors.warm} name="compass" size={18} />
                <View style={styles.inputInner}>
                  <Text style={styles.inputLabel}>Dropoff Destination</Text>
                  <TextInput
                    accessibilityLabel="Dropoff destination input"
                    onChangeText={setDropoffQuery}
                    placeholder="Dropoff destination (e.g. Apple Riata / Downtown)"
                    placeholderTextColor="#9ca3af"
                    style={styles.textInput}
                    value={dropoffQuery}
                  />
                </View>
                {dropoffQuery.length > 0 ? (
                  <Pressable onPress={() => setDropoffQuery('')} style={styles.inputActionBtn}>
                    <Text style={{ fontSize: 13, color: colors.inkSecondary }}>✕</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => setDropoffQuery('Apple Riata Campus (Parmer Ln)')}
                    style={styles.inputActionBtn}
                  >
                    <AppIcon color={colors.teal} name="calendar" size={18} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Date/Time & Frequency Settings */}
            <View style={styles.searchDetailsRow}>
              <View style={styles.searchDetailPill}>
                <AppIcon color={colors.appPrimary} name="calendar" size={16} />
                <View>
                  <Text style={styles.detailPillSmall}>When</Text>
                  <Text style={styles.detailPillVal}>Today, 8:15 AM</Text>
                </View>
              </View>
              <View style={styles.searchDetailPill}>
                <Text style={{ fontSize: 14 }}>🔁</Text>
                <View>
                  <Text style={styles.detailPillSmall}>Commute Mode</Text>
                  <Text style={[styles.detailPillVal, { color: colors.teal }]}>
                    Daily Commute 🔁
                  </Text>
                </View>
              </View>
            </View>

            {/* Find Rides Button */}
            <Pressable
              accessibilityLabel="Find Verified Carpools"
              accessibilityRole="button"
              onPress={() => refetch()}
              style={styles.findRidesBtn}
            >
              <AppIcon color={colors.surfaceContainerLowest} name="search" size={20} />
              <Text style={styles.findRidesBtnText}>Find Verified Carpools</Text>
            </Pressable>
          </View>

          {/* ── View Segmented Control (List vs Map) ────────────────────────── */}
          <View style={styles.segmentedContainer}>
            <Pressable
              accessibilityLabel="Available Rides list view"
              accessibilityRole="button"
              onPress={() => setViewMode('list')}
              style={[styles.segmentBtn, viewMode === 'list' && styles.segmentBtnActive]}
            >
              <AppIcon
                color={viewMode === 'list' ? colors.surfaceContainerLowest : colors.inkSecondary}
                name="car"
                size={18}
              />
              <Text
                style={[styles.segmentBtnText, viewMode === 'list' && styles.segmentBtnTextActive]}
              >
                Available Rides ({filteredRides.length})
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Live Route Map view"
              accessibilityRole="button"
              onPress={() => setViewMode('map')}
              style={[styles.segmentBtn, viewMode === 'map' && styles.segmentBtnActive]}
            >
              <AppIcon
                color={viewMode === 'map' ? colors.surfaceContainerLowest : colors.inkSecondary}
                name="map"
                size={18}
              />
              <Text
                style={[styles.segmentBtnText, viewMode === 'map' && styles.segmentBtnTextActive]}
              >
                Live Route Map
              </Text>
            </Pressable>
          </View>

          {/* ── Quick Filter Chips Horizontal Scroll ───────────────────────── */}
          <View style={styles.filterChipsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
            >
              {filterCategories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    accessibilityLabel={cat.label}
                    accessibilityRole="button"
                    onPress={() => setActiveCategory(cat.id)}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              accessibilityLabel="Open Filters and Sort Modal"
              accessibilityRole="button"
              onPress={() => setShowFilterModal(true)}
              style={styles.filterTriggerBtn}
            >
              <AppIcon color={colors.appPrimary} name="wrench" size={18} />
              <Text style={styles.filterTriggerText}>Filter</Text>
            </Pressable>
          </View>

          {/* ── Trust & Verified Commute Banner ────────────────────────────── */}
          <View style={styles.trustBanner}>
            <View style={styles.trustIconWrap}>
              <AppIcon color={colors.teal} name="verified-user" size={18} />
            </View>
            <Text style={styles.trustText}>
              <Text style={styles.trustTextBold}>100% Employer Verified Carpools</Text> · Zero Surge
              Pricing · Safe Desi Commute Community.
            </Text>
          </View>

          {/* ── Content View: Map or List ──────────────────────────────────── */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.appPrimary} size="large" />
              <Text style={styles.loadingText}>Loading verified carpools from Austin...</Text>
            </View>
          ) : isError ? (
            <View style={styles.emptyContainer}>
              <AppIcon color={colors.warm} name="warning" size={36} />
              <Text style={styles.emptyTitle}>Unable to load carpools</Text>
              <Text style={styles.emptySubtitle}>Please verify network connection and retry.</Text>
              <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : viewMode === 'map' ? (
            /* ── Interactive Live Route Map View ─────────────────────────────── */
            <View style={styles.mapCanvas}>
              <View style={styles.mapGridLines}>
                {/* Visual Highway Corridors */}
                <View style={styles.highwayCorridor1} />
                <View style={styles.highwayCorridor2} />
              </View>

              {/* Pins on the Map */}
              {filteredRides.map((ride) => {
                const isSelected = selectedMapRideId === ride.id;
                return (
                  <Pressable
                    key={ride.id}
                    accessibilityLabel={`View ride from ${ride.originArea} to ${ride.destinationArea}`}
                    onPress={() => setSelectedMapRideId(ride.id)}
                    style={[
                      styles.mapPinContainer,
                      { left: `${ride.mapX}%`, top: `${ride.mapY}%` },
                      isSelected && styles.mapPinContainerSelected,
                    ]}
                  >
                    <View style={[styles.mapPinBubble, isSelected && styles.mapPinBubbleSelected]}>
                      <Text style={[styles.mapPinPrice, isSelected && styles.mapPinPriceSelected]}>
                        {ride.contribution.split('/')[0].trim()}
                      </Text>
                    </View>
                    <View style={styles.mapPinPointer} />
                  </Pressable>
                );
              })}

              {/* Map Footer Helper */}
              <View style={styles.mapLegend}>
                <Text style={styles.mapLegendText}>
                  📍 Tap corridor pins to view carpool route details
                </Text>
              </View>

              {/* Selected Ride Quick Preview Sheet in Map */}
              {selectedMapRideId ? (
                <View style={styles.mapPreviewSheet}>
                  {(() => {
                    const ride = filteredRides.find((r) => r.id === selectedMapRideId);
                    if (!ride) return null;
                    return (
                      <View style={styles.mapPreviewInner}>
                        <View style={styles.mapPreviewHeader}>
                          <View>
                            <Text style={styles.mapPreviewTitle}>
                              {ride.driverName} ({ride.driverEmployer})
                            </Text>
                            <Text style={styles.mapPreviewRoute}>
                              {ride.originArea} ➔ {ride.destinationArea}
                            </Text>
                          </View>
                          <Pressable onPress={() => setSelectedMapRideId(null)}>
                            <Text style={{ fontSize: 14, color: colors.inkSecondary }}>✕</Text>
                          </Pressable>
                        </View>
                        <View style={styles.mapPreviewFooter}>
                          <Text style={styles.mapPreviewPrice}>{ride.contribution}</Text>
                          <Link asChild href={`/rides/${ride.id}` as Href}>
                            <Pressable style={styles.mapPreviewCta}>
                              <Text style={styles.mapPreviewCtaText}>View Details & Book</Text>
                            </Pressable>
                          </Link>
                        </View>
                      </View>
                    );
                  })()}
                </View>
              ) : null}
            </View>
          ) : (
            /* ── Active Ride Cards List ──────────────────────────────────────── */
            <View style={styles.cardsList}>
              {filteredRides.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <AppIcon color={colors.appPrimary} name="car" size={44} />
                  <Text style={styles.emptyTitle}>No carpools match your filter</Text>
                  <Text style={styles.emptySubtitle}>
                    Try changing your pickup area or clearing filters.
                  </Text>
                  <Pressable
                    onPress={() => {
                      setPickupQuery('');
                      setDropoffQuery('');
                      setActiveCategory('all');
                      setFilterWomenOnly(false);
                      setFilterEvOnly(false);
                      setFilterDailyOnly(false);
                    }}
                    style={styles.retryBtn}
                  >
                    <Text style={styles.retryBtnText}>Reset All Filters</Text>
                  </Pressable>
                </View>
              ) : isLargeDesktop ? (
                <View style={styles.comparisonTable}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Driver</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Route</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1.6 }]}>Schedule</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Tolls</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Seats</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Price</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1.3, textAlign: 'right' }]}>
                      Action
                    </Text>
                  </View>
                  {filteredRides.map((ride, idx) => (
                    <View
                      key={ride.id}
                      style={[styles.tableRow, idx % 2 === 1 && styles.tableRowEven]}
                    >
                      <View
                        style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                      >
                        <View style={styles.avatarCircleSmall}>
                          <Text style={styles.avatarInitialSmall}>{ride.driverName.charAt(0)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}
                          >
                            {ride.driverName}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <AppIcon color={colors.warm} name="star" size={10} />
                            <Text style={{ fontSize: 11, color: colors.muted }}>
                              {ride.driverRating.toFixed(1)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={{ flex: 2, paddingRight: 8 }}>
                        <Text
                          numberOfLines={1}
                          style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}
                        >
                          {ride.originArea}
                        </Text>
                        <Text numberOfLines={1} style={{ fontSize: 12, color: colors.muted }}>
                          → {ride.destinationArea}
                        </Text>
                      </View>

                      <View style={{ flex: 1.6 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.ink }}>
                          {ride.departureTimeDisplay}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.muted }}>
                          {ride.isRecurring ? 'Daily Commute' : 'One-Time Trip'}
                        </Text>
                      </View>

                      <View style={{ flex: 1.2 }}>
                        <View
                          style={[
                            styles.tollBadgeSmall,
                            ride.tollPreference === 'AVOID_TOLLS'
                              ? styles.tollBadgeAvoid
                              : styles.tollBadgeIncluded,
                          ]}
                        >
                          <Text
                            style={[
                              styles.tollBadgeTextSmall,
                              ride.tollPreference === 'AVOID_TOLLS'
                                ? styles.tollAvoidText
                                : styles.tollIncludedText,
                            ]}
                          >
                            {ride.tollPreference === 'AVOID_TOLLS'
                              ? 'No Tolls'
                              : ride.tollPreference === 'TOLLS_INCLUDED'
                                ? 'Tolls Inc.'
                                : 'Split Tolls'}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.teal }}>
                          {ride.seatsAvailable} left
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.appPrimary }}>
                          {ride.contribution.split('/')[0].trim()}
                        </Text>
                      </View>

                      <View style={{ flex: 1.3, alignItems: 'flex-end' }}>
                        <Link asChild href={`/rides/${ride.id}` as Href}>
                          <Pressable style={styles.tableActionBtn}>
                            <Text style={styles.tableActionBtnText}>View & Book</Text>
                          </Pressable>
                        </Link>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                filteredRides.map((ride) => (
                  <View key={ride.id} style={styles.rideCard}>
                    {/* Driver & Verification Header */}
                    <View style={styles.cardHeader}>
                      <View style={styles.driverInfoRow}>
                        <View style={styles.avatarWrap}>
                          <View style={styles.avatarCircle}>
                            <Text style={styles.avatarInitial}>{ride.driverName.charAt(0)}</Text>
                          </View>
                          {ride.verifiedDriver ? (
                            <View style={styles.verifiedCheck}>
                              <AppIcon
                                color={colors.surfaceContainerLowest}
                                name="check"
                                size={10}
                              />
                            </View>
                          ) : null}
                        </View>

                        <View>
                          <View style={styles.driverNameRow}>
                            <Text style={styles.driverName}>{ride.driverName}</Text>
                            <View style={styles.ratingBadge}>
                              <AppIcon color={colors.warm} name="star" size={11} />
                              <Text style={styles.ratingText}>{ride.driverRating.toFixed(1)}</Text>
                            </View>
                          </View>
                          <Text style={styles.driverSub}>
                            <Text style={styles.driverEmployer}>{ride.driverEmployer}</Text>
                            <Text> • </Text>
                            <Text style={styles.ridesCount}>{ride.ridesGiven} rides given</Text>
                          </Text>
                        </View>
                      </View>

                      {/* Contribution Price Pill */}
                      <View style={styles.priceColumn}>
                        <Text style={styles.priceAmount}>
                          {ride.contribution.split('/')[0].trim()}
                        </Text>
                        <Text style={styles.pricePer}>/ ride</Text>
                      </View>
                    </View>

                    {/* Route Visualizer */}
                    <View style={styles.routeBox}>
                      <View style={styles.routePoint}>
                        <View style={styles.originBullet} />
                        <Text numberOfLines={1} style={styles.pointText}>
                          {ride.originArea}
                        </Text>
                      </View>

                      <View style={styles.routeMid}>
                        <View style={styles.dashedConnector} />
                        <View style={styles.routeScheduleRow}>
                          <AppIcon color={colors.appPrimary} name="calendar" size={13} />
                          <Text style={styles.routeScheduleText}>
                            Departs {ride.departureTimeDisplay} · {ride.returnTimeDisplay}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.routePoint}>
                        <AppIcon color={colors.teal} name="compass" size={15} />
                        <Text numberOfLines={1} style={[styles.pointText, styles.pointTextBold]}>
                          {ride.destinationArea}
                        </Text>
                      </View>
                    </View>

                    {/* Vehicle & Seats Badge */}
                    <View style={styles.vehicleRow}>
                      <View style={styles.vehicleSpec}>
                        <AppIcon color={colors.appPrimary} name="car" size={16} />
                        <Text numberOfLines={1} style={styles.vehicleText}>
                          {ride.vehicleModel}
                        </Text>
                      </View>
                      <View style={styles.seatsLeftPill}>
                        <Text style={styles.seatsLeftText}>{ride.seatsAvailable} seats left</Text>
                      </View>
                    </View>

                    {/* Toll & Recurrence Badges */}
                    <View
                      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 }}
                    >
                      {ride.isRecurring ? (
                        <View
                          style={{
                            backgroundColor: 'rgba(0,105,107,0.1)',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                          }}
                        >
                          <Text style={{ color: colors.teal, fontSize: 11, fontWeight: '700' }}>
                            🔄{' '}
                            {ride.recurrencePattern === 'WEEKDAYS'
                              ? 'Weekdays Commute'
                              : 'Daily Commute'}
                          </Text>
                        </View>
                      ) : null}
                      <View
                        style={{
                          backgroundColor:
                            ride.tollPreference === 'AVOID_TOLLS'
                              ? 'rgba(16,185,129,0.12)'
                              : 'rgba(255,126,51,0.12)',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: ride.tollPreference === 'AVOID_TOLLS' ? '#059669' : colors.warm,
                            fontSize: 11,
                            fontWeight: '700',
                          }}
                        >
                          {ride.tollPreference === 'AVOID_TOLLS'
                            ? '🚫 Free Route (No Tolls)'
                            : ride.tollPreference === 'TOLLS_INCLUDED'
                              ? '🛣️ Tollway (Included)'
                              : '⚖️ Split Tolls'}
                        </Text>
                      </View>
                    </View>

                    {/* Vibe Tags */}
                    <View style={styles.vibesContainer}>
                      {ride.vibes.map((vibe, idx) => (
                        <View key={idx} style={styles.vibeTag}>
                          <Text style={styles.vibeTagText}>{vibe}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Card Action Buttons */}
                    <View style={styles.cardActions}>
                      <Link asChild href={`/rides/${ride.id}` as Href}>
                        <Pressable
                          accessibilityLabel={`Request seat with ${ride.driverName}`}
                          accessibilityRole="button"
                          style={styles.requestSeatBtn}
                        >
                          <AppIcon color={colors.surfaceContainerLowest} name="check" size={16} />
                          <Text style={styles.requestSeatBtnText}>Request Seat</Text>
                        </Pressable>
                      </Link>

                      <Pressable
                        accessibilityLabel={`Chat with ${ride.driverName}`}
                        accessibilityRole="button"
                        onPress={() =>
                          router.push(
                            `/chat?recipient=${encodeURIComponent(ride.driverName)}` as Href,
                          )
                        }
                        style={styles.chatBtn}
                      >
                        <AppIcon color={colors.appPrimary} name="message" size={18} />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── City Selector Modal ────────────────────────────────────────────── */}
      <Modal
        animationType="fade"
        onRequestClose={() => setShowCityModal(false)}
        transparent
        visible={showCityModal}
      >
        <Pressable onPress={() => setShowCityModal(false)} style={styles.modalOverlay}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.cityModalContent}>
            <View style={styles.cityModalHeader}>
              <Text style={styles.cityModalTitle}>Select Metro Area</Text>
              <Pressable onPress={() => setShowCityModal(false)} style={styles.modalCloseBtn}>
                <Text style={{ fontSize: 16, color: colors.inkSecondary }}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.cityList}>
              {CITIES.map((city) => {
                const isSelected = selectedCity.id === city.id;
                return (
                  <Pressable
                    key={city.id}
                    onPress={() => {
                      setSelectedCity(city);
                      setShowCityModal(false);
                    }}
                    style={[styles.cityItem, isSelected && styles.cityItemSelected]}
                  >
                    <View>
                      <Text
                        style={[styles.cityNameText, isSelected && styles.cityNameTextSelected]}
                      >
                        {city.name}
                      </Text>
                      <Text style={styles.cityCorridorsText}>
                        {city.corridors.slice(0, 2).join(' • ')}
                      </Text>
                    </View>
                    <View style={styles.cityItemRight}>
                      <Text
                        style={[styles.cityCountBadge, isSelected && styles.cityCountBadgeSelected]}
                      >
                        {city.count} carpools
                      </Text>
                      {isSelected ? (
                        <AppIcon color={colors.appPrimary} name="check" size={18} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Responsive Filter & Sort Modal (Bottom-up on Mobile, Centered on Web) ── */}
      <Modal
        animationType={isDesktop ? 'fade' : 'slide'}
        onRequestClose={() => setShowFilterModal(false)}
        transparent
        visible={showFilterModal}
      >
        <Pressable onPress={() => setShowFilterModal(false)} style={styles.modalOverlay}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.filterModalCard,
              isDesktop ? styles.filterModalDesktop : styles.filterModalMobile,
            ]}
          >
            {/* Modal Header */}
            <View style={styles.filterModalHeader}>
              <View style={styles.filterModalHeaderLeft}>
                <AppIcon color={colors.appPrimary} name="wrench" size={20} />
                <Text style={styles.filterModalTitle}>Filter & Sort Carpools</Text>
              </View>
              <Pressable onPress={() => setShowFilterModal(false)} style={styles.modalCloseBtn}>
                <Text style={{ fontSize: 16, color: colors.inkSecondary }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.filterModalBody}>
              {/* Sort By Section */}
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.sortOptionsGrid}>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortBy === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setSortBy(opt.id)}
                      style={[styles.sortPill, isSelected && styles.sortPillSelected]}
                    >
                      <Text style={styles.sortIcon}>{opt.icon}</Text>
                      <Text style={[styles.sortLabel, isSelected && styles.sortLabelSelected]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Commute & Safety Preferences */}
              <Text style={styles.filterSectionTitle}>Ride Preferences</Text>
              <View style={styles.preferenceRows}>
                <Pressable
                  onPress={() => setFilterWomenOnly(!filterWomenOnly)}
                  style={[styles.toggleRow, filterWomenOnly && styles.toggleRowActive]}
                >
                  <View style={styles.toggleRowLeft}>
                    <Text style={styles.toggleEmoji}>👩</Text>
                    <View>
                      <Text style={styles.toggleTitle}>Women Only Carpools</Text>
                      <Text style={styles.toggleDesc}>
                        Driver and all riders are verified women
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[styles.toggleCheckbox, filterWomenOnly && styles.toggleCheckboxActive]}
                  >
                    {filterWomenOnly ? <AppIcon color="#fff" name="check" size={14} /> : null}
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setFilterEvOnly(!filterEvOnly)}
                  style={[styles.toggleRow, filterEvOnly && styles.toggleRowActive]}
                >
                  <View style={styles.toggleRowLeft}>
                    <Text style={styles.toggleEmoji}>⚡</Text>
                    <View>
                      <Text style={styles.toggleTitle}>Tesla & Electric Vehicles (EV)</Text>
                      <Text style={styles.toggleDesc}>HOV fast lane speed and quiet ride</Text>
                    </View>
                  </View>
                  <View
                    style={[styles.toggleCheckbox, filterEvOnly && styles.toggleCheckboxActive]}
                  >
                    {filterEvOnly ? <AppIcon color="#fff" name="check" size={14} /> : null}
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setFilterDailyOnly(!filterDailyOnly)}
                  style={[styles.toggleRow, filterDailyOnly && styles.toggleRowActive]}
                >
                  <View style={styles.toggleRowLeft}>
                    <Text style={styles.toggleEmoji}>🔁</Text>
                    <View>
                      <Text style={styles.toggleTitle}>Daily Work Commute Only</Text>
                      <Text style={styles.toggleDesc}>Recurring Monday through Friday rides</Text>
                    </View>
                  </View>
                  <View
                    style={[styles.toggleCheckbox, filterDailyOnly && styles.toggleCheckboxActive]}
                  >
                    {filterDailyOnly ? <AppIcon color="#fff" name="check" size={14} /> : null}
                  </View>
                </Pressable>
              </View>
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={styles.filterModalFooter}>
              <Pressable
                onPress={() => {
                  setFilterWomenOnly(false);
                  setFilterEvOnly(false);
                  setFilterDailyOnly(false);
                  setSortBy('recommended');
                }}
                style={styles.filterResetBtn}
              >
                <Text style={styles.filterResetBtnText}>Reset</Text>
              </Pressable>
              <Pressable onPress={() => setShowFilterModal(false)} style={styles.filterApplyBtn}>
                <Text style={styles.filterApplyBtnText}>Show {filteredRides.length} Carpools</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f6f6ff',
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    zIndex: 10,
  },
  topBarDesktop: {
    alignSelf: 'center',
    maxWidth: 960,
    width: '100%',
  },
  topBarLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
  },
  logoBadge: {
    borderRadius: radius.pill,
  },
  logoCircle: {
    alignItems: 'center',
    backgroundColor: colors.appPrimary,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  brandTitle: {
    color: colors.appPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  moduleBadge: {
    backgroundColor: 'rgba(0,105,107,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  moduleBadgeText: {
    color: colors.teal,
    fontSize: 10,
    fontWeight: '700',
  },
  citySelector: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 1,
  },
  cityName: {
    color: '#4b5563',
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 180,
  },
  topBarRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
  },
  iconBtn: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    position: 'relative',
    width: 36,
  },
  badgeCount: {
    backgroundColor: colors.warm,
    borderRadius: radius.pill,
    height: 16,
    position: 'absolute',
    right: -2,
    top: -2,
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCountText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  offerRideBtn: {
    alignItems: 'center',
    backgroundColor: colors.appPrimary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: colors.appPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  offerRideBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mainContainer: {
    paddingHorizontal: space.x4,
    paddingTop: space.x3,
  },
  mainContainerDesktop: {
    alignSelf: 'center',
    maxWidth: 960,
    width: '100%',
  },

  // Search Card
  searchCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 24,
    borderWidth: 1,
    padding: space.x4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  searchInputsGroup: {
    position: 'relative',
  },
  searchInputRow: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  originIndicator: {
    backgroundColor: colors.appPrimary,
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  inputInner: {
    flex: 1,
  },
  inputLabel: {
    color: '#6b7280',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textInput: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    padding: 0,
  },
  inputActionBtn: {
    padding: 4,
  },
  swapContainer: {
    alignItems: 'flex-end',
    marginVertical: -10,
    paddingRight: 16,
    zIndex: 2,
  },
  swapBtn: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.pill,
    borderWidth: 1,
    elevation: 2,
    height: 28,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: 28,
  },
  searchDetailsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  searchDetailPill: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  detailPillSmall: {
    color: '#6b7280',
    fontSize: 9,
    fontWeight: '600',
  },
  detailPillVal: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '700',
  },
  findRidesBtn: {
    alignItems: 'center',
    backgroundColor: colors.appPrimary,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 12,
  },
  findRidesBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Segmented View Control
  segmentedContainer: {
    backgroundColor: '#eaedff',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 4,
    marginTop: space.x3,
    padding: 4,
  },
  segmentBtn: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  segmentBtnActive: {
    backgroundColor: colors.appPrimary,
    shadowColor: colors.appPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  segmentBtnText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Filter Chips Row
  filterChipsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: space.x3,
  },
  chipsScroll: {
    flex: 1,
  },
  chip: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.pill,
    borderWidth: 1,
    marginRight: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: colors.appPrimary,
    borderColor: colors.appPrimary,
  },
  chipText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  filterTriggerBtn: {
    alignItems: 'center',
    backgroundColor: '#eaedff',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterTriggerText: {
    color: colors.appPrimary,
    fontSize: 11,
    fontWeight: '700',
  },

  // Trust Banner
  trustBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,105,107,0.06)',
    borderColor: 'rgba(0,105,107,0.2)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: space.x3,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  trustIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,105,107,0.15)',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  trustText: {
    color: '#374151',
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  trustTextBold: {
    color: colors.teal,
    fontWeight: '700',
  },

  // Loading & Empty States
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  loadingText: {
    color: '#4b5563',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    marginTop: space.x3,
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySubtitle: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.appPrimary,
    borderRadius: radius.pill,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Cards List
  cardsList: {
    gap: space.x3,
    marginTop: space.x3,
  },
  rideCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 24,
    borderWidth: 1,
    padding: space.x4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  driverInfoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: colors.appPrimary,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  verifiedCheck: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    borderRadius: radius.pill,
    bottom: -2,
    height: 16,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 16,
  },
  driverNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  driverName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  ratingBadge: {
    alignItems: 'center',
    backgroundColor: '#eaedff',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  ratingText: {
    color: colors.appPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  driverSub: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 1,
  },
  driverEmployer: {
    color: '#374151',
    fontWeight: '600',
  },
  ridesCount: {
    color: colors.teal,
    fontWeight: '600',
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    color: colors.appPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  pricePer: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '600',
  },

  // Route Box
  routeBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    marginTop: 12,
    padding: 10,
  },
  routePoint: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  originBullet: {
    backgroundColor: colors.appPrimary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  pointText: {
    color: '#1f2937',
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  pointTextBold: {
    color: '#111827',
    fontWeight: '700',
  },
  routeMid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
    paddingLeft: 4,
  },
  dashedConnector: {
    borderLeftColor: '#d1d5db',
    borderLeftWidth: 1.5,
    height: 16,
    marginLeft: 0.5,
  },
  routeScheduleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  routeScheduleText: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '500',
  },

  // Vehicle Row
  vehicleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  vehicleSpec: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  vehicleText: {
    color: '#4b5563',
    fontSize: 11,
    fontWeight: '500',
  },
  seatsLeftPill: {
    backgroundColor: 'rgba(0,105,107,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  seatsLeftText: {
    color: colors.teal,
    fontSize: 10,
    fontWeight: '700',
  },

  // Vibes
  vibesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  vibeTag: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  vibeTagText: {
    color: '#4b5563',
    fontSize: 10,
    fontWeight: '500',
  },

  // Card Actions
  cardActions: {
    borderTopColor: '#f3f4f6',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
  },
  requestSeatBtn: {
    alignItems: 'center',
    backgroundColor: colors.appPrimary,
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 9,
    shadowColor: colors.appPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  requestSeatBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  chatBtn: {
    alignItems: 'center',
    backgroundColor: '#eaedff',
    borderRadius: 14,
    height: 38,
    justifyContent: 'center',
    width: 42,
  },

  // Map View
  mapCanvas: {
    backgroundColor: '#e5e7eb',
    borderRadius: 24,
    height: 380,
    marginTop: space.x3,
    overflow: 'hidden',
    position: 'relative',
  },
  mapGridLines: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#1f2937',
  },
  highwayCorridor1: {
    backgroundColor: 'rgba(67,30,190,0.4)',
    height: 6,
    position: 'absolute',
    top: '40%',
    transform: [{ rotate: '-25deg' }],
    width: '120%',
  },
  highwayCorridor2: {
    backgroundColor: 'rgba(0,105,107,0.35)',
    height: 6,
    position: 'absolute',
    top: '60%',
    transform: [{ rotate: '35deg' }],
    width: '120%',
  },
  mapPinContainer: {
    alignItems: 'center',
    position: 'absolute',
    transform: [{ translateX: -20 }, { translateY: -30 }],
  },
  mapPinContainerSelected: {
    zIndex: 10,
  },
  mapPinBubble: {
    backgroundColor: colors.appPrimary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mapPinBubbleSelected: {
    backgroundColor: colors.warm,
    transform: [{ scale: 1.1 }],
  },
  mapPinPrice: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  mapPinPriceSelected: {
    color: '#ffffff',
  },
  mapPinPointer: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 5,
    borderRightColor: 'transparent',
    borderRightWidth: 5,
    borderTopColor: colors.appPrimary,
    borderTopWidth: 6,
    height: 0,
    width: 0,
  },
  mapLegend: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: radius.pill,
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
  },
  mapLegendText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  mapPreviewSheet: {
    bottom: 12,
    left: 12,
    position: 'absolute',
    right: 12,
    zIndex: 20,
  },
  mapPreviewInner: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  mapPreviewHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mapPreviewTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  mapPreviewRoute: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
  },
  mapPreviewFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  mapPreviewPrice: {
    color: colors.appPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  mapPreviewCta: {
    backgroundColor: colors.appPrimary,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mapPreviewCtaText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: space.x4,
  },
  cityModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    maxWidth: 440,
    overflow: 'hidden',
    width: '100%',
  },
  cityModalHeader: {
    alignItems: 'center',
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  cityModalTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 4,
  },
  cityList: {
    padding: space.x3,
  },
  cityItem: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: space.x3,
  },
  cityItemSelected: {
    backgroundColor: '#eaedff',
  },
  cityNameText: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '700',
  },
  cityNameTextSelected: {
    color: colors.appPrimary,
  },
  cityCorridorsText: {
    color: '#6b7280',
    fontSize: 10,
    marginTop: 2,
  },
  cityItemRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cityCountBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: radius.pill,
    color: '#4b5563',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cityCountBadgeSelected: {
    backgroundColor: colors.appPrimary,
    color: '#ffffff',
  },

  // Responsive Filter Modal (Bottom up on mobile, centered on desktop)
  filterModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
  },
  filterModalMobile: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    bottom: 0,
    maxHeight: '80%',
    position: 'absolute',
  },
  filterModalDesktop: {
    maxWidth: 520,
  },
  filterModalHeader: {
    alignItems: 'center',
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  filterModalHeaderLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  filterModalTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  filterModalBody: {
    padding: space.x4,
  },
  filterSectionTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
  },
  sortOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortPill: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sortPillSelected: {
    backgroundColor: '#eaedff',
    borderColor: colors.appPrimary,
  },
  sortIcon: {
    fontSize: 13,
  },
  sortLabel: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '600',
  },
  sortLabelSelected: {
    color: colors.appPrimary,
    fontWeight: '700',
  },
  preferenceRows: {
    gap: 8,
    marginTop: 4,
  },
  toggleRow: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  toggleRowActive: {
    backgroundColor: '#f2f3ff',
    borderColor: colors.appPrimary,
  },
  toggleRowLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  toggleEmoji: {
    fontSize: 20,
  },
  toggleTitle: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleDesc: {
    color: '#6b7280',
    fontSize: 10,
    marginTop: 1,
  },
  toggleCheckbox: {
    alignItems: 'center',
    borderColor: '#d1d5db',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  toggleCheckboxActive: {
    backgroundColor: colors.appPrimary,
    borderColor: colors.appPrimary,
  },
  filterModalFooter: {
    alignItems: 'center',
    borderTopColor: '#f3f4f6',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: space.x4,
  },
  filterResetBtn: {
    alignItems: 'center',
    borderColor: '#d1d5db',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterResetBtnText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '600',
  },
  filterApplyBtn: {
    alignItems: 'center',
    backgroundColor: colors.appPrimary,
    borderRadius: 14,
    flex: 1,
    paddingVertical: 10,
  },
  filterApplyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  comparisonTable: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginTop: space.x3,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: space.x3,
    paddingHorizontal: space.x4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.x3,
    paddingHorizontal: space.x4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowEven: {
    backgroundColor: '#fafbff',
  },
  avatarCircleSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.appPrimary,
  },
  tollBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  tollBadgeAvoid: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  tollBadgeIncluded: {
    backgroundColor: 'rgba(255,126,51,0.12)',
  },
  tollBadgeTextSmall: {
    fontSize: 11,
    fontWeight: '700',
  },
  tollAvoidText: {
    color: '#059669',
  },
  tollIncludedText: {
    color: colors.warm,
  },
  tableActionBtn: {
    backgroundColor: colors.appPrimary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tableActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
