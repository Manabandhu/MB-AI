import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/authStore';
import { createRideOffer } from '@/modules/rides/api';
import {
  type AutocompletePrediction,
  autocompletePlacesGoogle,
  fetchGoogleRoute,
  geocodeAddress,
  type RouteInfo,
} from '@/modules/rides/services/googleMapsService';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const TRIP_MODES = [
  { id: 'ONE_TIME', label: 'One-Time Trip' },
  { id: 'RECURRING', label: 'Daily Commute' },
];

const _RECURRENCE_PATTERNS = [
  { id: 'WEEKDAYS', label: 'Weekdays (Mon–Fri)' },
  { id: 'DAILY', label: 'Every Day (7 Days)' },
  { id: 'WEEKLY', label: 'Weekly Roundtrip' },
];

const ALL_DAYS = [
  { id: 'MON', label: 'M' },
  { id: 'TUE', label: 'T' },
  { id: 'WED', label: 'W' },
  { id: 'THU', label: 'Th' },
  { id: 'FRI', label: 'F' },
  { id: 'SAT', label: 'Sa' },
  { id: 'SUN', label: 'Su' },
];

type TollPreference = 'AVOID_TOLLS' | 'TOLLS_INCLUDED' | 'TOLLS_SPLIT';

const TOLL_OPTIONS: { id: TollPreference; label: string; desc: string }[] = [
  { id: 'AVOID_TOLLS', label: 'Avoid Tolls', desc: 'Free Routes Only' },
  { id: 'TOLLS_INCLUDED', label: 'Tolls Included', desc: 'No extra cost' },
  { id: 'TOLLS_SPLIT', label: 'Split Tolls', desc: 'Split with riders' },
];

const LUGGAGE_OPTIONS = [
  { id: 'BACKPACK_ONLY', label: 'Backpack' },
  { id: 'MEDIUM', label: 'Medium Bag' },
  { id: 'LARGE_SUITCASE', label: 'Large Luggage' },
];

const GENDER_OPTIONS = [
  { id: 'ANY', label: 'Open to All' },
  { id: 'FEMALE_ONLY', label: 'Women Only' },
];

const RECENT_TEMPLATES = [
  {
    id: 'coppell-dallas',
    origin: 'Coppell, TX',
    destination: 'Downtown Dallas, TX',
    seats: 3,
    price: '12',
    isRecurring: true,
    pattern: 'WEEKDAYS',
    days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    tollPref: 'AVOID_TOLLS',
  },
  {
    id: 'plano-austin',
    origin: 'Plano - Legacy West, TX',
    destination: 'Austin - Domain Central, TX',
    seats: 3,
    price: '30',
    isRecurring: false,
    pattern: 'ONE_TIME',
    days: [],
    tollPref: 'TOLLS_INCLUDED',
  },
];

export function RideOfferScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const _user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => sub.remove();
  }, [router]);

  // Form states
  const [origin, setOrigin] = useState('Dallas - Frisco / Plano, TX');
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 33.1507,
    lng: -96.8236,
  });
  const [originSuggestions, setOriginSuggestions] = useState<AutocompletePrediction[]>([]);
  const [loadingOriginSuggestions, setLoadingOriginSuggestions] = useState(false);

  const [destination, setDestination] = useState('Austin - Downtown / Domain, TX');
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 30.4015,
    lng: -97.7247,
  });
  const [destinationSuggestions, setDestinationSuggestions] = useState<AutocompletePrediction[]>(
    [],
  );
  const [loadingDestSuggestions, setLoadingDestSuggestions] = useState(false);

  // Toll Preference & Route Info
  const [tollPref, setTollPref] = useState<'AVOID_TOLLS' | 'TOLLS_INCLUDED' | 'TOLLS_SPLIT'>(
    'AVOID_TOLLS',
  );
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  // Schedule & Recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<string>('WEEKDAYS');
  const [selectedDays, setSelectedDays] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [departureDate, setDepartureDate] = useState('Today / Tomorrow');
  const [departureTime, setDepartureTime] = useState('5:30 PM');

  // Seats & Price
  const [seats, setSeats] = useState(3);
  const [pricePerSeat, setPricePerSeat] = useState('28');

  // Preferences
  const [luggageCapacity, setLuggageCapacity] = useState('MEDIUM');
  const [genderPref, setGenderPref] = useState('ANY');
  const [_vehicle, _setVehicle] = useState('2023 Tesla Model Y (Pearl White)');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  // Fetch route geometry whenever coords or toll preference changes
  useEffect(() => {
    async function updateRoute() {
      if (!originCoords || !destinationCoords) return;
      setCalculatingRoute(true);
      try {
        const route = await fetchGoogleRoute(
          originCoords,
          destinationCoords,
          tollPref === 'AVOID_TOLLS',
        );
        if (route) {
          setRouteInfo(route);
        }
      } catch (err) {
        console.warn('Failed to calculate route:', err);
      } finally {
        setCalculatingRoute(false);
      }
    }
    updateRoute();
  }, [originCoords, destinationCoords, tollPref]);

  // Places autocomplete handler for Origin
  const handleOriginChange = async (text: string) => {
    setOrigin(text);
    if (text.length >= 3) {
      setLoadingOriginSuggestions(true);
      const results = await autocompletePlacesGoogle(text);
      setOriginSuggestions(results);
      setLoadingOriginSuggestions(false);
    } else {
      setOriginSuggestions([]);
    }
  };

  const handleSelectOrigin = async (p: AutocompletePrediction) => {
    setOrigin(p.description);
    setOriginSuggestions([]);
    const coords = await geocodeAddress(p.placeId || p.description);
    if (coords) setOriginCoords(coords);
  };

  // Places autocomplete handler for Destination
  const handleDestinationChange = async (text: string) => {
    setDestination(text);
    if (text.length >= 3) {
      setLoadingDestSuggestions(true);
      const results = await autocompletePlacesGoogle(text);
      setDestinationSuggestions(results);
      setLoadingDestSuggestions(false);
    } else {
      setDestinationSuggestions([]);
    }
  };

  const handleSelectDestination = async (p: AutocompletePrediction) => {
    setDestination(p.description);
    setDestinationSuggestions([]);
    const coords = await geocodeAddress(p.placeId || p.description);
    if (coords) setDestinationCoords(coords);
  };

  // Apply quick re-post template
  const applyTemplate = async (template: (typeof RECENT_TEMPLATES)[0]) => {
    setOrigin(template.origin);
    setDestination(template.destination);
    setSeats(template.seats);
    setPricePerSeat(template.price);
    setIsRecurring(template.isRecurring);
    setRecurrencePattern(template.pattern);
    setSelectedDays(template.days);
    setTollPref(template.tollPref as TollPreference);

    // Geocode both
    const [c1, c2] = await Promise.all([
      geocodeAddress(template.origin),
      geocodeAddress(template.destination),
    ]);
    if (c1) setOriginCoords(c1);
    if (c2) setDestinationCoords(c2);
  };

  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId],
    );
  };

  const handleSwap = () => {
    const tempO = origin;
    const tempC = originCoords;
    setOrigin(destination);
    setOriginCoords(destinationCoords);
    setDestination(tempO);
    setDestinationCoords(tempC);
  };

  const mutation = useMutation({
    mutationFn: createRideOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      setPublished(true);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
      Alert.alert('Publish Failed', err.message);
    },
  });

  const handlePublish = () => {
    setErrorMsg(null);
    if (!origin.trim() || !destination.trim()) {
      setErrorMsg('Please enter a valid pickup and dropoff point.');
      return;
    }

    const title = `${origin.split(',')[0].trim()} to ${destination.split(',')[0].trim()} Carpool`;
    const numPrice = parseFloat(pricePerSeat) || 15;

    mutation.mutate({
      title,
      pickupArea: origin.trim(),
      destination: destination.trim(),
      departureAt: new Date(Date.now() + 86400000).toISOString(),
      seatsTotal: seats,
      contribution: numPrice,
      originLat: originCoords?.lat,
      originLng: originCoords?.lng,
      destinationLat: destinationCoords?.lat,
      destinationLng: destinationCoords?.lng,
      routePolyline: routeInfo?.polyline || undefined,
      distanceMiles: routeInfo?.distanceMiles || undefined,
      estimatedDurationMins: routeInfo?.durationMinutes || undefined,
      tollPreference: tollPref,
      isRecurring,
      recurrencePattern: isRecurring ? recurrencePattern : 'ONE_TIME',
      recurringDays: isRecurring ? selectedDays : [],
      luggageCapacity,
      genderPreference: genderPref,
    });
  };

  if (published) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.successContainer}>
          <View style={s.successIconCircle}>
            <AppIcon name="car" size={36} color="#ffffff" />
          </View>
          <Text style={s.successTitle}>Ride Offer Published! 🚗</Text>
          <Text style={s.successSubtitle}>
            Your carpool from {origin.split(',')[0].trim()} to {destination.split(',')[0].trim()} is
            active in discovery feeds. Verified travelers can request seats.
          </Text>
          <View style={s.successCard}>
            <Text style={s.successRouteText}>
              {origin} → {destination}
            </Text>
            <Text style={s.successMetaText}>
              📅 {isRecurring ? `Recurring (${selectedDays.join(', ')})` : departureDate} •{' '}
              {departureTime}
            </Text>
            <Text style={s.successSeatsText}>
              💺 {seats} Seats Available • ${pricePerSeat}/seat • {tollPref.replace('_', ' ')}
            </Text>
          </View>
          <View style={s.successActions}>
            <Pressable style={s.primaryBtn} onPress={() => router.replace('/rides/mine')}>
              <Text style={s.primaryBtnText}>View My Offered Rides</Text>
            </Pressable>
            <Pressable
              style={s.outlineBtn}
              onPress={() => {
                setPublished(false);
                router.replace('/rides');
              }}
            >
              <Text style={s.outlineBtnText}>Explore Feed</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View
            style={[s.header, { paddingTop: Math.max(insets.top > 0 ? 8 : space.x3, space.x3) }]}
          >
            <Pressable
              onPress={() => router.back()}
              style={s.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={s.backText}>← Back</Text>
            </Pressable>
            <Text style={s.headerTitle}>Offer a Carpool</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* 1. Top Template Ribbon: Re-post Recent Trip */}
          <View style={s.templateSection}>
            <View style={s.sectionHeaderRow}>
              <AppIcon name="sparks" size={16} color={colors.primary} />
              <Text style={s.sectionEyebrow}>FAST RE-POST RECENT TRIPS</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.templateScroll}
            >
              {RECENT_TEMPLATES.map((item) => (
                <Pressable key={item.id} style={s.templateCard} onPress={() => applyTemplate(item)}>
                  <View style={s.templateTop}>
                    <Text style={s.templateBadge}>
                      {item.isRecurring ? '🔄 Commute' : '⚡ One-Time'}
                    </Text>
                    <Text style={s.templatePrice}>${item.price}/seat</Text>
                  </View>
                  <Text numberOfLines={1} style={s.templateRoute}>
                    {item.origin.split(',')[0]} → {item.destination.split(',')[0]}
                  </Text>
                  <Text style={s.templateMeta}>
                    {item.seats} seats •{' '}
                    {item.tollPref === 'AVOID_TOLLS' ? 'No Tolls' : 'Tolls Inc.'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* 2. Route & Address Inputs with Autocomplete */}
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <Text style={s.cardTitle}>Route & Coordinates</Text>
              <Pressable style={s.swapBtn} onPress={handleSwap}>
                <AppIcon name="compass" size={14} color={colors.primary} />
                <Text style={s.swapText}>Swap</Text>
              </Pressable>
            </View>

            {/* Origin Input */}
            <View style={s.inputContainer}>
              <View style={s.inputHeaderRow}>
                <Text style={s.fieldLabel}>PICKUP LOCATION</Text>
                {origin.length > 0 && (
                  <Pressable onPress={() => setOrigin('')}>
                    <Text style={s.clearText}>Clear</Text>
                  </Pressable>
                )}
              </View>
              <View style={s.inputWithMarker}>
                <View style={s.greenPin} />
                <TextInput
                  style={s.locationInput}
                  value={origin}
                  onChangeText={handleOriginChange}
                  placeholder="Enter city, suburb, or address"
                  placeholderTextColor={colors.muted}
                />
                {loadingOriginSuggestions && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </View>

              {/* Origin Autocomplete Suggestions */}
              {originSuggestions.length > 0 && (
                <View style={s.suggestionBox}>
                  {originSuggestions.map((item, idx) => (
                    <Pressable
                      key={idx}
                      style={s.suggestionRow}
                      onPress={() => handleSelectOrigin(item)}
                    >
                      <AppIcon name="compass" size={14} color={colors.teal} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.suggestionMainText}>
                          {item.mainText || item.description}
                        </Text>
                        {item.secondaryText && (
                          <Text style={s.suggestionSubText}>{item.secondaryText}</Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Destination Input */}
            <View style={[s.inputContainer, { marginTop: space.x3 }]}>
              <View style={s.inputHeaderRow}>
                <Text style={s.fieldLabel}>DROPOFF DESTINATION</Text>
                {destination.length > 0 && (
                  <Pressable onPress={() => setDestination('')}>
                    <Text style={s.clearText}>Clear</Text>
                  </Pressable>
                )}
              </View>
              <View style={s.inputWithMarker}>
                <View style={s.redPin} />
                <TextInput
                  style={s.locationInput}
                  value={destination}
                  onChangeText={handleDestinationChange}
                  placeholder="Enter work hub, college, or city"
                  placeholderTextColor={colors.muted}
                />
                {loadingDestSuggestions && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </View>

              {/* Destination Autocomplete Suggestions */}
              {destinationSuggestions.length > 0 && (
                <View style={s.suggestionBox}>
                  {destinationSuggestions.map((item, idx) => (
                    <Pressable
                      key={idx}
                      style={s.suggestionRow}
                      onPress={() => handleSelectDestination(item)}
                    >
                      <AppIcon name="compass" size={14} color={colors.teal} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.suggestionMainText}>
                          {item.mainText || item.description}
                        </Text>
                        {item.secondaryText && (
                          <Text style={s.suggestionSubText}>{item.secondaryText}</Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Route Stats & Polyline Summary */}
            <View style={s.routeStatsCard}>
              <View style={s.routeStatsLeft}>
                <AppIcon name="car" size={18} color={colors.teal} />
                <View>
                  <Text style={s.routeStatsHeadline}>
                    {calculatingRoute
                      ? 'Calculating Google route...'
                      : routeInfo
                        ? `~${routeInfo.distanceMiles} mi • ${Math.floor(routeInfo.durationMinutes / 60) > 0 ? `${Math.floor(routeInfo.durationMinutes / 60)}h ` : ''}${routeInfo.durationMinutes % 60}m`
                        : 'Direct Corridor Route'}
                  </Text>
                  <Text style={s.routeStatsSub}>
                    {routeInfo?.hasTolls
                      ? '⚠️ Toll roads present on highway route'
                      : '✅ Zero Tolls / Free Route Selected'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 3. Toll Preference (Segmented Control) */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Tollway Preference</Text>
            <Text style={s.cardSubtitle}>Specify how toll costs are handled for this carpool.</Text>
            <View style={s.tollSelectorRow}>
              {TOLL_OPTIONS.map((opt) => {
                const isSelected = tollPref === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    style={[s.tollOptionCard, isSelected && s.tollOptionCardSelected]}
                    onPress={() => setTollPref(opt.id)}
                  >
                    <Text style={[s.tollOptionTitle, isSelected && s.tollOptionTitleSelected]}>
                      {opt.label}
                    </Text>
                    <Text style={[s.tollOptionDesc, isSelected && s.tollOptionDescSelected]}>
                      {opt.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 4. Schedule Mode (One-Time vs Daily Commute) */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Schedule Mode</Text>
            <View style={s.modeSelectorRow}>
              {TRIP_MODES.map((m) => {
                const active = (m.id === 'RECURRING') === isRecurring;
                return (
                  <Pressable
                    key={m.id}
                    style={[s.modePill, active && s.modePillActive]}
                    onPress={() => setIsRecurring(m.id === 'RECURRING')}
                  >
                    <Text style={[s.modePillText, active && s.modePillTextActive]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {isRecurring ? (
              <View style={s.recurringSection}>
                <View style={s.recurringShortcutsRow}>
                  <Text style={s.fieldLabel}>ACTIVE COMMUTE DAYS</Text>
                  <Pressable
                    onPress={() => setSelectedDays(['MON', 'TUE', 'WED', 'THU', 'FRI'])}
                    style={s.shortcutBtn}
                  >
                    <Text style={s.shortcutBtnText}>Weekdays (Mon–Fri)</Text>
                  </Pressable>
                </View>
                <View style={s.daysRow}>
                  {ALL_DAYS.map((day) => {
                    const isDaySelected = selectedDays.includes(day.id);
                    return (
                      <Pressable
                        key={day.id}
                        style={[s.dayPill, isDaySelected && s.dayPillSelected]}
                        onPress={() => toggleDay(day.id)}
                      >
                        <Text style={[s.dayPillText, isDaySelected && s.dayPillTextSelected]}>
                          {day.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={s.dateTimeRow}>
                <View style={s.dateTimeBox}>
                  <Text style={s.fieldLabel}>DEPARTURE DATE</Text>
                  <TextInput
                    style={s.textInput}
                    value={departureDate}
                    onChangeText={setDepartureDate}
                  />
                </View>
                <View style={s.dateTimeBox}>
                  <Text style={s.fieldLabel}>DEPARTURE TIME</Text>
                  <TextInput
                    style={s.textInput}
                    value={departureTime}
                    onChangeText={setDepartureTime}
                  />
                </View>
              </View>
            )}
          </View>

          {/* 5. Seats & Fuel Share Contribution */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Seats & Fuel Contribution</Text>
            <View style={s.seatsRow}>
              <View style={s.seatCounterBox}>
                <Text style={s.fieldLabel}>AVAILABLE SEATS</Text>
                <View style={s.counterControls}>
                  <Pressable
                    style={s.counterBtn}
                    onPress={() => setSeats((c) => Math.max(1, c - 1))}
                  >
                    <Text style={s.counterBtnText}>−</Text>
                  </Pressable>
                  <Text style={s.counterValue}>{seats}</Text>
                  <Pressable
                    style={s.counterBtn}
                    onPress={() => setSeats((c) => Math.min(6, c + 1))}
                  >
                    <Text style={s.counterBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={s.priceBox}>
                <Text style={s.fieldLabel}>PRICE / SEAT ($)</Text>
                <TextInput
                  style={s.priceInput}
                  keyboardType="numeric"
                  value={pricePerSeat}
                  onChangeText={setPricePerSeat}
                />
              </View>
            </View>

            {/* Luggage Capacity */}
            <View style={{ marginTop: space.x4 }}>
              <Text style={s.fieldLabel}>LUGGAGE CAPACITY</Text>
              <View style={s.pillsRow}>
                {LUGGAGE_OPTIONS.map((lug) => (
                  <Pressable
                    key={lug.id}
                    style={[s.filterPill, luggageCapacity === lug.id && s.filterPillActive]}
                    onPress={() => setLuggageCapacity(lug.id)}
                  >
                    <Text
                      style={[
                        s.filterPillText,
                        luggageCapacity === lug.id && s.filterPillTextActive,
                      ]}
                    >
                      {lug.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Gender Preference */}
            <View style={{ marginTop: space.x4 }}>
              <Text style={s.fieldLabel}>TRAVELER PREFERENCE</Text>
              <View style={s.pillsRow}>
                {GENDER_OPTIONS.map((g) => (
                  <Pressable
                    key={g.id}
                    style={[s.filterPill, genderPref === g.id && s.filterPillActive]}
                    onPress={() => setGenderPref(g.id)}
                  >
                    <Text style={[s.filterPillText, genderPref === g.id && s.filterPillTextActive]}>
                      {g.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {errorMsg && <Text style={s.errorText}>{errorMsg}</Text>}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Sticky Bottom Bar */}
        <View style={s.bottomBar}>
          <View style={s.bottomSummaryCol}>
            <Text style={s.totalContributionText}>${pricePerSeat} / seat</Text>
            <Text style={s.totalSeatsText}>{seats} seats offered</Text>
          </View>
          <Pressable
            style={[s.publishBtn, mutation.isPending && s.publishBtnDisabled]}
            disabled={mutation.isPending}
            onPress={handlePublish}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={s.publishBtnText}>Publish Ride Offer</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9ff' },
  scroll: { padding: space.x4, gap: space.x4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.x2,
  },
  backBtn: { padding: space.x2 },
  backText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  headerTitle: { ...typography.h3, color: colors.ink, fontWeight: '800' },

  templateSection: { gap: space.x2 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: space.x2 },
  sectionEyebrow: { color: colors.teal, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  templateScroll: { gap: space.x3, paddingVertical: space.x1 },
  templateCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.card,
    padding: space.x3,
    borderWidth: 1,
    borderColor: 'rgba(67,30,190,0.12)',
    width: 200,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  templateTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  templateBadge: { fontSize: 11, fontWeight: '700', color: colors.teal },
  templatePrice: { fontSize: 13, fontWeight: '800', color: colors.primary },
  templateRoute: { fontSize: 13, fontWeight: '700', color: colors.ink },
  templateMeta: { fontSize: 11, color: colors.muted },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: radius.card,
    padding: space.x4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: space.x3,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...typography.h4, color: colors.ink, fontWeight: '800' },
  cardSubtitle: { ...typography.caption, color: colors.muted },
  swapBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  swapText: { color: colors.primary, fontSize: 12, fontWeight: '700' },

  inputContainer: { gap: 4 },
  inputHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: colors.muted, letterSpacing: 0.5 },
  clearText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  inputWithMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6ff',
    borderRadius: radius.control,
    paddingHorizontal: space.x3,
    height: 48,
    gap: space.x2,
  },
  greenPin: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' },
  redPin: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
  locationInput: { flex: 1, fontSize: 14, color: colors.ink, fontWeight: '600' },

  suggestionBox: {
    backgroundColor: '#ffffff',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(67,30,190,0.15)',
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.x3,
    gap: space.x2,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f8',
  },
  suggestionMainText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  suggestionSubText: { fontSize: 11, color: colors.muted },

  routeStatsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0faf8',
    borderRadius: radius.card,
    padding: space.x3,
    borderWidth: 1,
    borderColor: 'rgba(0,105,107,0.15)',
  },
  routeStatsLeft: { flexDirection: 'row', alignItems: 'center', gap: space.x3 },
  routeStatsHeadline: { fontSize: 13, fontWeight: '800', color: colors.ink },
  routeStatsSub: { fontSize: 11, color: colors.teal, fontWeight: '600' },

  tollSelectorRow: { flexDirection: 'row', gap: space.x2 },
  tollOptionCard: {
    flex: 1,
    padding: space.x3,
    borderRadius: radius.card,
    backgroundColor: '#f6f7fb',
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 2,
  },
  tollOptionCardSelected: {
    backgroundColor: 'rgba(67,30,190,0.06)',
    borderColor: colors.primary,
  },
  tollOptionTitle: { fontSize: 12, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  tollOptionTitleSelected: { color: colors.primary, fontWeight: '800' },
  tollOptionDesc: { fontSize: 10, color: colors.muted, textAlign: 'center' },
  tollOptionDescSelected: { color: colors.teal, fontWeight: '600' },

  modeSelectorRow: { flexDirection: 'row', gap: space.x2 },
  modePill: {
    flex: 1,
    paddingVertical: space.x2,
    borderRadius: radius.pill,
    backgroundColor: '#f0f1f7',
    alignItems: 'center',
  },
  modePillActive: { backgroundColor: colors.primary },
  modePillText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  modePillTextActive: { color: '#ffffff' },

  recurringSection: { gap: space.x2, marginTop: space.x2 },
  recurringShortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shortcutBtn: { padding: 4 },
  shortcutBtnText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dayPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f1f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillSelected: { backgroundColor: colors.teal },
  dayPillText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  dayPillTextSelected: { color: '#ffffff' },

  dateTimeRow: { flexDirection: 'row', gap: space.x3, marginTop: space.x2 },
  dateTimeBox: { flex: 1, gap: 4 },
  textInput: {
    backgroundColor: '#f5f6ff',
    borderRadius: radius.control,
    paddingHorizontal: space.x3,
    height: 44,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },

  seatsRow: { flexDirection: 'row', gap: space.x4 },
  seatCounterBox: { flex: 1, gap: 4 },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
    backgroundColor: '#f5f6ff',
    borderRadius: radius.control,
    height: 44,
    paddingHorizontal: space.x2,
    justifyContent: 'space-between',
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  counterValue: { fontSize: 16, fontWeight: '800', color: colors.ink },
  priceBox: { flex: 1, gap: 4 },
  priceInput: {
    backgroundColor: '#f5f6ff',
    borderRadius: radius.control,
    height: 44,
    paddingHorizontal: space.x3,
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },

  pillsRow: { flexDirection: 'row', gap: space.x2, marginTop: 4 },
  filterPill: {
    paddingHorizontal: space.x3,
    paddingVertical: space.x2,
    borderRadius: radius.pill,
    backgroundColor: '#f0f1f7',
  },
  filterPillActive: { backgroundColor: colors.teal },
  filterPillText: { fontSize: 12, fontWeight: '700', color: colors.ink },
  filterPillTextActive: { color: '#ffffff' },

  errorText: { color: colors.error, fontSize: 13, fontWeight: '700', textAlign: 'center' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.x4,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eef0f8',
  },
  bottomSummaryCol: { gap: 2 },
  totalContributionText: { ...typography.h4, color: colors.ink, fontWeight: '800' },
  totalSeatsText: { ...typography.caption, color: colors.muted },
  publishBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: space.x5,
    paddingVertical: space.x3,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnDisabled: { opacity: 0.6 },
  publishBtnText: { ...typography.bodyStrong, color: '#ffffff', fontSize: 14, fontWeight: '800' },

  successContainer: {
    flex: 1,
    padding: space.x6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x4,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { ...typography.h2, color: colors.ink, textAlign: 'center', fontWeight: '800' },
  successSubtitle: { ...typography.body, color: colors.muted, textAlign: 'center' },
  successCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: space.x4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  successRouteText: { ...typography.bodyStrong, color: colors.ink, fontSize: 15 },
  successMetaText: { ...typography.caption, color: colors.muted },
  successSeatsText: { ...typography.caption, color: colors.teal, fontWeight: '700' },
  successActions: { width: '100%', gap: space.x3, marginTop: space.x2 },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: space.x3,
    borderRadius: radius.control,
    alignItems: 'center',
  },
  primaryBtnText: { ...typography.bodyStrong, color: '#ffffff', fontSize: 15 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.x3,
    borderRadius: radius.control,
    alignItems: 'center',
  },
  outlineBtnText: { ...typography.bodyStrong, color: colors.ink, fontSize: 14 },
});
