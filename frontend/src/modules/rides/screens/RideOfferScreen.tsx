import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/authStore';
import { createRideOffer } from '@/modules/rides/api';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const TRIP_TYPES = ['One-time Trip', 'Recurring Daily Commute', 'Weekend Return'] as const;

const COMMUTE_VIBES = [
  { id: 'nosmoking', label: 'Strictly Non-Smoking', icon: 'shield' },
  { id: 'music', label: 'Telugu & Hindi Music 🎵', icon: 'music' },
  { id: 'ac', label: 'AC Kept Moderate / Cool ❄️', icon: 'wind' },
  { id: 'bags', label: '2 Medium Bags Allowed 🧳', icon: 'briefcase' },
  { id: 'tech', label: 'Work & Tech Chats Welcome 💻', icon: 'laptop' },
  { id: 'pets', label: 'Pet Friendly 🐾', icon: 'heart' },
];

export function RideOfferScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // Form states
  const [origin, setOrigin] = useState('Dallas - Frisco / Plano, TX');
  const [originLandmark, setOriginLandmark] = useState('Patel Brothers Plano or Stonebriar Mall');
  const [destination, setDestination] = useState('Austin - Downtown / Domain, TX');
  const [destinationLandmark, setDestinationLandmark] = useState('Domain Central or UT Austin Campus');
  const [intermediateStop, setIntermediateStop] = useState("Waco Buc-ee's / Temple");
  const [expressLanes, setExpressLanes] = useState(true);

  const [tripType, setTripType] = useState<string>(TRIP_TYPES[0]);
  const [departureDate, setDepartureDate] = useState('Friday, Oct 25, 2024');
  const [departureTime, setDepartureTime] = useState('5:30 PM');
  const [flexibleTime, setFlexibleTime] = useState(true);
  const [returnRide, setReturnRide] = useState(false);

  const [seats, setSeats] = useState(3);
  const [pricePerSeat, setPricePerSeat] = useState('28');

  const [vehicle, setVehicle] = useState('2023 Tesla Model Y (Pearl White)');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([
    'nosmoking',
    'music',
    'ac',
    'bags',
    'tech',
  ]);
  const [womenOnly, setWomenOnly] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

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

  const handleSwap = () => {
    const tempO = origin;
    const tempL = originLandmark;
    setOrigin(destination);
    setOriginLandmark(destinationLandmark);
    setDestination(tempO);
    setDestinationLandmark(tempL);
  };

  const handleVibeToggle = (id: string) => {
    setSelectedVibes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const handlePublish = () => {
    setErrorMsg(null);
    if (!origin.trim() || !destination.trim()) {
      setErrorMsg('Please enter valid origin and destination');
      return;
    }

    const title = `${origin.split('-')[0].trim()} to ${destination.split('-')[0].trim()} Carpool`;
    const numPrice = parseFloat(pricePerSeat) || 28;

    mutation.mutate({
      title,
      pickupArea: `${origin} (${originLandmark})`,
      destination: `${destination} (${destinationLandmark})`,
      departureAt: `${departureDate} at ${departureTime}`,
      seatsTotal: seats,
      contribution: numPrice,
    });
  };

  const totalContribution = seats * (parseFloat(pricePerSeat) || 0);

  if (published) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.successContainer}>
          <View style={s.successIconCircle}>
            <AppIcon name="car" size={36} color="#ffffff" />
          </View>
          <Text style={s.successTitle}>Ride Offer Published! 🚗</Text>
          <Text style={s.successSubtitle}>
            Your carpool from {origin.split('-')[0].trim()} to {destination.split('-')[0].trim()} is
            now active. Verified travelers can request seats.
          </Text>
          <View style={s.successCard}>
            <Text style={s.successRouteText}>
              {origin} → {destination}
            </Text>
            <Text style={s.successMetaText}>
              📅 {departureDate} • {departureTime}
            </Text>
            <Text style={s.successSeatsText}>
              💺 {seats} Seats Available • ${pricePerSeat}/seat
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
              }}
            >
              <Text style={s.outlineBtnText}>Offer Another Ride</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.flex}
      >
        {/* Top Header */}
        <View style={s.topBar}>
          <Pressable style={s.iconBtn} onPress={() => router.back()}>
            <AppIcon name="chevron-left" size={24} color={colors.ink} />
          </Pressable>
          <View style={s.topBarCenter}>
            <Text style={s.topBarTitle}>Offer a Ride</Text>
            <Text style={s.topBarSubtitle}>Zero Commission • Community Carpool</Text>
          </View>
          <Pressable style={s.myRidesBtn} onPress={() => router.push('/rides/mine')}>
            <Text style={s.myRidesBtnText}>My Rides</Text>
          </Pressable>
        </View>

        <ScrollView style={s.flex} contentContainerStyle={s.content}>
          {/* Route & Journey Planner Card */}
          <View style={s.card}>
            <View style={s.routeHeaderRow}>
              <Text style={s.cardTitle}>Route & Departure Point</Text>
              <Pressable style={s.swapBtn} onPress={handleSwap}>
                <AppIcon name="compass" size={16} color={colors.primary} />
                <Text style={s.swapText}>Swap</Text>
              </Pressable>
            </View>

            {/* Origin */}
            <View style={s.locationInputGroup}>
              <View style={s.locationMarkerOrigin}>
                <View style={s.originDot} />
              </View>
              <View style={s.locationTextCol}>
                <Text style={s.fieldLabel}>DEPARTURE ORIGIN</Text>
                <TextInput
                  style={s.locationInput}
                  value={origin}
                  onChangeText={setOrigin}
                  placeholder="City or metro area"
                />
                <Text style={s.landmarkHint}>📍 Landmark: {originLandmark}</Text>
              </View>
            </View>

            {/* Connector */}
            <View style={s.routeConnectorRow}>
              <View style={s.dashedLine} />
              <View style={s.transitPill}>
                <Text style={s.transitText}>~195 miles • 3 hrs 10 mins (I-35)</Text>
              </View>
            </View>

            {/* Destination */}
            <View style={s.locationInputGroup}>
              <View style={s.locationMarkerDest}>
                <AppIcon name="map" size={14} color="#dc2626" />
              </View>
              <View style={s.locationTextCol}>
                <Text style={s.fieldLabel}>DESTINATION</Text>
                <TextInput
                  style={s.locationInput}
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="Drop-off city or metro"
                />
                <Text style={s.landmarkHint}>📍 Drop: {destinationLandmark}</Text>
              </View>
            </View>

            {/* Intermediate stop & Tolls */}
            <View style={s.stopCard}>
              <View style={s.stopHeader}>
                <AppIcon name="map" size={16} color={colors.warm} />
                <Text style={s.stopTitle}>Rest Stop / Pickup: {intermediateStop}</Text>
              </View>
              <Pressable
                style={s.expressRow}
                onPress={() => setExpressLanes(!expressLanes)}
              >
                <View style={[s.checkbox, expressLanes && s.checkboxChecked]}>
                  {expressLanes ? <AppIcon name="check" size={12} color="#ffffff" /> : null}
                </View>
                <Text style={s.expressText}>
                  Take I-35 Express Toll Lanes (Faster travel • Gas/toll split)
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Date & Schedule Selector Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Schedule & Frequency</Text>

            {/* Trip Type Pills */}
            <View style={s.tripTypeRow}>
              {TRIP_TYPES.map((type) => {
                const isSelected = tripType === type;
                return (
                  <Pressable
                    key={type}
                    style={[s.tripPill, isSelected && s.tripPillActive]}
                    onPress={() => setTripType(type)}
                  >
                    <Text style={[s.tripPillText, isSelected && s.tripPillTextActive]}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Date & Time */}
            <View style={s.dateTimeRow}>
              <View style={s.dateTimeBox}>
                <Text style={s.fieldLabel}>DEPARTURE DATE</Text>
                <View style={s.inputWithIcon}>
                  <AppIcon name="calendar" size={16} color={colors.primary} />
                  <TextInput
                    style={s.textInputInner}
                    value={departureDate}
                    onChangeText={setDepartureDate}
                  />
                </View>
              </View>
              <View style={s.dateTimeBox}>
                <Text style={s.fieldLabel}>DEPARTURE TIME</Text>
                <View style={s.inputWithIcon}>
                  <AppIcon name="calendar" size={16} color={colors.primary} />
                  <TextInput
                    style={s.textInputInner}
                    value={departureTime}
                    onChangeText={setDepartureTime}
                  />
                </View>
              </View>
            </View>

            <View style={s.toggleRow}>
              <Text style={s.toggleLabel}>Flexible Departure (±30 mins)</Text>
              <Switch
                value={flexibleTime}
                onValueChange={setFlexibleTime}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
            <View style={s.toggleRow}>
              <Text style={s.toggleLabel}>Offer return ride on Sunday evening</Text>
              <Switch
                value={returnRide}
                onValueChange={setReturnRide}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>

          {/* Available Seats & Fair Contribution Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Available Seats & Fair Gas Split</Text>

            <View style={s.seatsStepperRow}>
              <View>
                <Text style={s.seatsCount}>{seats} Seats Available</Text>
                <Text style={s.seatsSubtext}>Comfortable middle/window passenger seating</Text>
              </View>
              <View style={s.stepper}>
                <Pressable
                  style={s.stepperBtn}
                  onPress={() => setSeats((c) => Math.max(1, c - 1))}
                >
                  <Text style={s.stepperBtnText}>-</Text>
                </Pressable>
                <Text style={s.stepperValue}>{seats}</Text>
                <Pressable
                  style={s.stepperBtn}
                  onPress={() => setSeats((c) => Math.min(6, c + 1))}
                >
                  <Text style={s.stepperBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Price Per Seat */}
            <View style={s.priceBox}>
              <View style={s.priceInputGroup}>
                <Text style={s.currencyPrefix}>$</Text>
                <TextInput
                  style={s.priceInput}
                  keyboardType="numeric"
                  value={pricePerSeat}
                  onChangeText={setPricePerSeat}
                />
                <Text style={s.perSeatLabel}>/ passenger</Text>
              </View>
              <View style={s.trustHintBox}>
                <Text style={s.trustHintText}>
                  💡 Recommended fair split: $25 - $32 to cover I-35 gas & toll fees. ManaBandhu
                  charges 0% platform fee.
                </Text>
              </View>
            </View>
          </View>

          {/* Vehicle & Commute Vibe Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Vehicle & Commute Preferences</Text>

            <Text style={s.fieldLabel}>VEHICLE MODEL</Text>
            <View style={s.inputWithIcon}>
              <AppIcon name="car" size={18} color={colors.primary} />
              <TextInput style={s.textInputInner} value={vehicle} onChangeText={setVehicle} />
            </View>

            <Text style={s.fieldLabel}>COMMUTE VIBE & RULES</Text>
            <View style={s.vibesWrap}>
              {COMMUTE_VIBES.map((vibe) => {
                const isSelected = selectedVibes.includes(vibe.id);
                return (
                  <Pressable
                    key={vibe.id}
                    style={[s.vibeChip, isSelected && s.vibeChipActive]}
                    onPress={() => handleVibeToggle(vibe.id)}
                  >
                    <Text style={[s.vibeChipText, isSelected && s.vibeChipTextActive]}>
                      {isSelected ? '✓ ' : '+ '}
                      {vibe.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Women-Only Privacy Toggle */}
            <View style={s.womenOnlyCard}>
              <View style={s.womenOnlyInfo}>
                <View style={s.womenOnlyHeader}>
                  <AppIcon name="shield" size={16} color={colors.teal} />
                  <Text style={s.womenOnlyTitle}>Women-Only Carpool Option</Text>
                </View>
                <Text style={s.womenOnlySubtext}>
                  Only verified female travelers can book seats on this ride.
                </Text>
              </View>
              <Switch
                value={womenOnly}
                onValueChange={setWomenOnly}
                trackColor={{ false: colors.border, true: colors.teal }}
              />
            </View>
          </View>

          {/* Driver Trust Card */}
          <View style={s.driverCard}>
            <View style={s.driverAvatar}>
              <Text style={s.driverAvatarText}>{user?.user_metadata?.full_name?.[0] ?? 'S'}</Text>
            </View>
            <View style={s.driverInfo}>
              <Text style={s.driverName}>
                Driver: {user?.user_metadata?.full_name ?? 'Suresh Reddy'}
              </Text>
              <Text style={s.driverStats}>
                ★ 4.9 (34 rides) • Texas DL Verified • Apple Corporate
              </Text>
            </View>
          </View>

          {errorMsg ? <Text style={s.errorText}>{errorMsg}</Text> : null}
          <View style={s.bottomSpacer} />
        </ScrollView>

        {/* Fixed Sticky Action Bar */}
        <View style={s.bottomBar}>
          <View style={s.bottomSummaryCol}>
            <Text style={s.totalContributionText}>${totalContribution} Total Split</Text>
            <Text style={s.totalSeatsText}>for {seats} passengers</Text>
          </View>
          <Pressable
            style={[s.publishBtn, mutation.isPending && s.publishBtnDisabled]}
            onPress={handlePublish}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={s.publishBtnText}>Publish Ride Offer →</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.x4, gap: space.x4 },
  bottomSpacer: { height: 80 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: { padding: space.x1 },
  topBarCenter: { alignItems: 'center' },
  topBarTitle: { ...typography.h3, color: colors.ink, fontWeight: '800' },
  topBarSubtitle: { ...typography.caption, color: colors.teal, fontWeight: '700' },
  myRidesBtn: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: space.x3,
    paddingVertical: space.x1,
    borderRadius: radius.pill,
  },
  myRidesBtnText: { ...typography.caption, color: colors.primary, fontWeight: '700' },

  card: {
    backgroundColor: colors.surface,
    padding: space.x4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.x3,
  },
  cardTitle: { ...typography.h4, color: colors.ink, fontWeight: '800' },
  routeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.x2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  swapText: { ...typography.caption, color: colors.primary, fontWeight: '700' },

  locationInputGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.x3,
  },
  locationMarkerOrigin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16a34a',
  },
  locationMarkerDest: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  locationTextCol: { flex: 1, gap: 2 },
  fieldLabel: { ...typography.overline, color: colors.muted, fontSize: 10 },
  locationInput: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    paddingVertical: 2,
  },
  landmarkHint: { ...typography.caption, color: colors.muted, fontSize: 11 },

  routeConnectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 11,
    gap: space.x3,
    marginVertical: -2,
  },
  dashedLine: {
    width: 2,
    height: 28,
    backgroundColor: colors.border,
  },
  transitPill: {
    backgroundColor: colors.background,
    paddingHorizontal: space.x2,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transitText: { ...typography.caption, color: colors.muted, fontSize: 10 },

  stopCard: {
    backgroundColor: '#fbfcfe',
    padding: space.x3,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.x2,
  },
  stopHeader: { flexDirection: 'row', alignItems: 'center', gap: space.x2 },
  stopTitle: { ...typography.caption, color: colors.ink, fontWeight: '700' },
  expressRow: { flexDirection: 'row', alignItems: 'center', gap: space.x2 },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  expressText: { ...typography.caption, color: colors.muted, fontSize: 11 },

  tripTypeRow: { flexDirection: 'row', gap: space.x2 },
  tripPill: {
    flex: 1,
    paddingVertical: space.x2,
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tripPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tripPillText: { ...typography.caption, color: colors.ink, fontWeight: '600', fontSize: 11 },
  tripPillTextActive: { color: '#ffffff', fontWeight: '800' },

  dateTimeRow: { flexDirection: 'row', gap: space.x3 },
  dateTimeBox: { flex: 1, gap: 4 },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: space.x3,
    backgroundColor: colors.surface,
  },
  textInputInner: { flex: 1, paddingVertical: space.x2, fontSize: 13, color: colors.ink },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleLabel: { ...typography.caption, color: colors.ink, fontWeight: '600' },

  seatsStepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seatsCount: { ...typography.bodyStrong, color: colors.ink, fontSize: 16 },
  seatsSubtext: { ...typography.caption, color: colors.muted, fontSize: 11 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: space.x3,
    paddingVertical: space.x2,
    backgroundColor: colors.background,
  },
  stepperBtnText: { fontSize: 18, fontWeight: '800', color: colors.ink },
  stepperValue: { paddingHorizontal: space.x3, fontSize: 16, fontWeight: '800', color: colors.primary },

  priceBox: { gap: space.x2 },
  priceInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: space.x3,
  },
  currencyPrefix: { fontSize: 20, fontWeight: '800', color: colors.ink },
  priceInput: { fontSize: 20, fontWeight: '800', color: colors.ink, paddingVertical: space.x2, flex: 1 },
  perSeatLabel: { ...typography.caption, color: colors.muted },
  trustHintBox: {
    backgroundColor: '#f7f5ff',
    padding: space.x2,
    borderRadius: radius.control,
  },
  trustHintText: { ...typography.caption, color: colors.primary, fontSize: 11 },

  vibesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
  vibeChip: {
    paddingHorizontal: space.x3,
    paddingVertical: space.x1,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vibeChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  vibeChipText: { ...typography.caption, color: colors.ink, fontSize: 11, fontWeight: '600' },
  vibeChipTextActive: { color: colors.primary, fontWeight: '800' },

  womenOnlyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    padding: space.x3,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 4,
  },
  womenOnlyInfo: { flex: 1, paddingRight: space.x2 },
  womenOnlyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  womenOnlyTitle: { ...typography.caption, color: colors.teal, fontWeight: '800' },
  womenOnlySubtext: { ...typography.caption, color: colors.ink, fontSize: 10, marginTop: 2 },

  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
    backgroundColor: colors.surface,
    padding: space.x3,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  driverInfo: { flex: 1 },
  driverName: { ...typography.bodyStrong, color: colors.ink, fontSize: 13 },
  driverStats: { ...typography.caption, color: colors.teal, fontSize: 11 },

  errorText: { color: colors.error, ...typography.caption, textAlign: 'center' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.x4,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    backgroundColor: colors.surface,
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
