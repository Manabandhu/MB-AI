import { color as baseColors, radius, space } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/authStore';
import { bookRideSeat, getRideOffer, saveRide, unsaveRide } from '@/modules/rides/api';
import type { RideOffer } from '@/modules/rides/types';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const colors = {
  ...baseColors,
  appPrimary: '#431ebe',
  primaryContainer: '#5b3fd6',
  surfaceContainer: '#eaedff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainerLowest: '#ffffff',
  inkSecondary: baseColors.muted,
  warm: '#ff7e33',
  teal: '#00696b',
  tealSoft: 'rgba(0,105,107,0.08)',
  indigoSoft: 'rgba(67,30,190,0.07)',
};

export function RideDetailScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const queryClient = useQueryClient();

  const authStatus = useAuthStore((state) => state.status);
  const isAuthenticated = authStatus === 'authenticated';

  const [isSaved, setIsSaved] = useState(false);
  const [selectedSeatSlots, setSelectedSeatSlots] = useState<number[]>([3]); // default selected seat 3
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Fetch ride offer from backend
  const { data: rawOffer, isLoading, isError, refetch } = useQuery({
    queryKey: ['rides', 'detail', rideId],
    queryFn: () => getRideOffer(rideId as string),
    enabled: Boolean(rideId),
  });

  // Derive presentation data dynamically from rawOffer
  const detailData = useMemo(() => {
    if (!rawOffer) return null;
    const depTime = rawOffer.departureAt
      ? new Date(rawOffer.departureAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Flexible Departure';
    const costDollars = (parseFloat(String(rawOffer.contribution || '6').replace(/[^0-9.]/g, '')) || 6).toFixed(2);

    return {
      ...rawOffer,
      driverName: rawOffer.driverId ? `Verified Driver (${rawOffer.driverId.slice(0, 6)})` : 'Verified Driver',
      driverTitle: 'Community Carpool Host',
      driverEmployer: 'Verified Member',
      driverCorporateEmail: undefined,
      driverRating: 4.95,
      carpoolsGiven: 24,
      onTimeRate: '99%',
      replySpeed: 'Fast reply',
      driverQuote: 'Sharing community commute to split fuel and travel together.',
      commuteFreq: 'Community Carpool',
      durationEst: 'Direct Corridor Route',
      routeDistance: `${rawOffer.originArea} to ${rawOffer.destinationArea}`,
      trafficCondition: 'Standard Traffic',
      highwayNote: `Direct corridor commute from ${rawOffer.originArea} to ${rawOffer.destinationArea}`,
      pickupExact: rawOffer.originArea,
      dropoffExact: rawOffer.destinationArea,
      pickupTime: depTime,
      dropoffTime: undefined,
      contribution: `$${costDollars}`,
      fuelShareEstimate: `$${costDollars}`,
      vehicleName: 'Commuter Vehicle',
      vehicleSub: 'Insured Member Vehicle',
      amenities: [
        { icon: '⚡', label: 'Carpool Eligible' },
        { icon: '❄️', label: 'Air Conditioned' },
        { icon: '🎒', label: 'Trunk Space' },
      ],
      ecoTag: 'Zero Brokerage Community Commute 🌿',
      vibes: ['Direct Commute 🚗', 'Non-Smoking 🚭'],
      totalSeats: rawOffer.seatsTotal || 4,
      coRiders: [],
    };
  }, [rawOffer]);

  // Seat Booking Mutation
  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!rideId) throw new Error('Missing ride ID');
      return bookRideSeat(rideId, selectedSeatSlots.length);
    },
    onSuccess: () => {
      setBookingSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['rides', 'detail', rideId] });
      queryClient.invalidateQueries({ queryKey: ['rides', 'offers'] });
    },
  });

  function toggleSeat(slotNum: number) {
    if (selectedSeatSlots.includes(slotNum)) {
      if (selectedSeatSlots.length === 1) return; // keep at least 1
      setSelectedSeatSlots(selectedSeatSlots.filter((s) => s !== slotNum));
    } else {
      setSelectedSeatSlots([...selectedSeatSlots, slotNum]);
    }
  }

  function handleRequestSeat() {
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }
    setShowBookingModal(true);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.appPrimary} size="large" />
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !rawOffer || !detailData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <AppIcon color={colors.warm} name="warning" size={40} />
          <Text style={styles.emptyTitle}>Unable to load ride</Text>
          <Text style={styles.emptySubtitle}>The ride might have expired or been removed.</Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back to Rides</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const numericCost = parseFloat(String(detailData.contribution || '$6').replace(/[^0-9.]/g, '')) || 6;
  const totalCost = (numericCost * selectedSeatSlots.length).toFixed(2);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* ── Top App Bar ────────────────────────────────────────────────────────── */}
      <View style={[styles.topBar, isDesktop && styles.topBarDesktop]}>
        <View style={styles.topBarLeft}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backIconButton}
          >
            <AppIcon color={colors.ink} name="chevron-left" size={22} />
          </Pressable>
          <View style={styles.titleWithEmblem}>
            <Text style={styles.screenTitle}>Ride Details</Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusPillText}>
              Active · {detailData.seatsAvailable ?? 2} Seats Left
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Bookmark ride"
            accessibilityRole="button"
            onPress={() => setIsSaved(!isSaved)}
            style={styles.iconButton}
          >
            <AppIcon
              color={isSaved ? colors.warm : colors.inkSecondary}
              name="star"
              size={22}
            />
          </Pressable>

          <Pressable
            accessibilityLabel="Share ride"
            accessibilityRole="button"
            onPress={() => {}}
            style={styles.iconButton}
          >
            <Text style={{ fontSize: 16, color: colors.inkSecondary }}>↗</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.mainContainer, isDesktop && styles.mainContainerDesktop]}>
          {/* ── Driver Profile Card ─────────────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.driverHeader}>
              <View style={styles.driverProfileLeft}>
                <View style={styles.driverAvatarCircle}>
                  <Text style={styles.driverAvatarInitial}>
                    {detailData.driverName.charAt(0)}
                  </Text>
                  <View style={styles.verifiedDriverBadge}>
                    <AppIcon color={colors.surfaceContainerLowest} name="check" size={10} />
                  </View>
                </View>

                <View>
                  <View style={styles.driverNameRow}>
                    <Text style={styles.driverName}>{detailData.driverName}</Text>
                    <View style={styles.staffBadge}>
                      <Text style={styles.staffBadgeText}>{detailData.driverTitle}</Text>
                    </View>
                  </View>
                  <View style={styles.employerRow}>
                    <AppIcon color={colors.inkSecondary} name="home" size={13} />
                    <Text style={styles.employerName}>{detailData.driverEmployer}</Text>
                  </View>
                  <View style={styles.ratingsRow}>
                    <View style={styles.starRow}>
                      <AppIcon color={colors.warm} name="star" size={13} />
                      <Text style={styles.ratingNumber}>{detailData.driverRating.toFixed(1)}</Text>
                      <Text style={styles.ratingCount}>({detailData.carpoolsGiven} carpools)</Text>
                    </View>
                    <Text style={styles.dotSeparator}>•</Text>
                    <View style={styles.onTimeRow}>
                      <AppIcon color={colors.teal} name="calendar" size={12} />
                      <Text style={styles.onTimeText}>{detailData.onTimeRate} On-time</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.driverBadgeStack}>
                <View style={styles.fastReplyPill}>
                  <AppIcon color={colors.teal} name="sparks" size={12} />
                  <Text style={styles.fastReplyText}>{detailData.replySpeed}</Text>
                </View>
                <View style={styles.superCommuterPill}>
                  <Text style={styles.superCommuterText}>Desi Super Commuter</Text>
                </View>
              </View>
            </View>

            {/* Driver Quote */}
            <View style={styles.quoteBox}>
              <Text style={{ fontSize: 18, color: colors.appPrimary, fontWeight: '800' }}>“</Text>
              <Text style={styles.quoteText}>“{detailData.driverQuote}”</Text>
            </View>
          </View>

          {/* ── Route & Schedule Timeline Card ──────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.dateRow}>
                <AppIcon color={colors.appPrimary} name="calendar" size={18} />
                <View>
                  <Text style={styles.dateTitle}>Today, Scheduled Commute</Text>
                  <Text style={styles.dateSub}>{detailData.commuteFreq}</Text>
                </View>
              </View>
              <View style={styles.durationBadge}>
                <AppIcon color={colors.teal} name="sparks" size={13} />
                <Text style={styles.durationText}>{detailData.durationEst}</Text>
              </View>
            </View>

            {/* Visual Route Timeline */}
            <View style={styles.timelineContainer}>
              {/* Vertical Continuous Route Line */}
              <View style={styles.timelineTrack} />

              {/* Stop 1: Pickup */}
              <View style={styles.timelineStop}>
                <View style={styles.timelineBulletPickup} />
                <View style={styles.stopContent}>
                  <View style={styles.stopHeader}>
                    <Text style={styles.stopTitle}>{detailData.originArea}</Text>
                    <Text style={styles.stopTimePrimary}>{detailData.pickupTime}</Text>
                  </View>
                  <Text style={styles.stopAddress}>
                    <AppIcon color={colors.inkSecondary} name="compass" size={12} /> {detailData.pickupExact}
                  </Text>
                </View>
              </View>

              {/* Highway Corridor Highlight */}
              <View style={styles.corridorHighlight}>
                <AppIcon color={colors.appPrimary} name="car" size={14} />
                <Text style={styles.corridorText}>{detailData.highwayNote}</Text>
              </View>

              {/* Stop 2: Dropoff */}
              <View style={styles.timelineStop}>
                <View style={styles.timelineBulletDropoff} />
                <View style={styles.stopContent}>
                  <View style={styles.stopHeader}>
                    <Text style={styles.stopTitle}>{detailData.destinationArea}</Text>
                    <Text style={styles.stopTimeSecondary}>{detailData.dropoffTime}</Text>
                  </View>
                  <Text style={styles.stopAddress}>
                    <AppIcon color={colors.teal} name="compass" size={12} /> {detailData.dropoffExact}
                  </Text>
                </View>
              </View>
            </View>

            {/* Live Corridor Stats */}
            <View style={styles.routeStatsBox}>
              <View style={styles.routeDistanceRow}>
                <AppIcon color={colors.teal} name="compass" size={15} />
                <Text style={styles.routeDistanceText}>{detailData.routeDistance}</Text>
              </View>
              <View style={styles.trafficPill}>
                <Text style={styles.trafficText}>{detailData.trafficCondition}</Text>
              </View>
            </View>
          </View>

          {/* ── Vehicle Specifications Card ─────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.sectionEyebrow}>Vehicle Details</Text>
                <Text style={styles.vehicleTitle}>{detailData.vehicleName}</Text>
                <Text style={styles.vehicleSubtitle}>{detailData.vehicleSub}</Text>
              </View>
              <View style={styles.carIconCircle}>
                <AppIcon color={colors.appPrimary} name="car" size={24} />
              </View>
            </View>

            {/* Amenities Grid */}
            <View style={styles.amenitiesGrid}>
              {detailData.amenities.map((item: any, idx: number) => (
                <View key={idx} style={styles.amenityItem}>
                  <Text style={styles.amenityIcon}>{item.icon}</Text>
                  <Text style={styles.amenityLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Eco Badge */}
            <View style={styles.ecoBadge}>
              <Text style={styles.ecoBadgeText}>{detailData.ecoTag}</Text>
            </View>
          </View>

          {/* ── Commute Vibe & Preferences ─────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeading}>Commute Vibe & Preferences</Text>
              <Text style={styles.verifiedTag}>Driver verified</Text>
            </View>
            <View style={styles.vibesGrid}>
              {detailData.vibes.map((vibe: string, idx: number) => (
                <View key={idx} style={styles.vibePill}>
                  <Text style={styles.vibePillText}>{vibe}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Vehicle Capacity & Co-Riders Grid ───────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardHeading}>Vehicle Capacity & Co-Riders</Text>
                <Text style={styles.capacitySub}>4 total passenger slots</Text>
              </View>
              <View style={styles.seatsAvailableBadge}>
                <Text style={styles.seatsAvailableText}>
                  {detailData.seatsAvailable ?? 2} Seats Available
                </Text>
              </View>
            </View>

            <View style={styles.seatSlotsGrid}>
              {/* Slot 1: Driver */}
              <View style={styles.seatSlotOccupied}>
                <View style={styles.seatSlotTop}>
                  <Text style={styles.seatSlotLabel}>Seat 1 · Driver</Text>
                  <AppIcon color={colors.appPrimary} name="user" size={16} />
                </View>
                <View style={styles.seatOccupant}>
                  <View style={styles.miniOccupantAvatar}>
                    <Text style={styles.miniOccupantInitial}>
                      {detailData.driverName.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.miniOccupantName}>{detailData.driverName}</Text>
                    <Text style={styles.miniOccupantRole}>Driver</Text>
                  </View>
                </View>
              </View>

              {/* Slot 2: Co-Rider */}
              <View style={styles.seatSlotOccupied}>
                <View style={styles.seatSlotTop}>
                  <Text style={[styles.seatSlotLabel, { color: colors.teal }]}>Seat 2 · Co-rider</Text>
                  <AppIcon color={colors.teal} name="user" size={16} />
                </View>
                <View style={styles.seatOccupant}>
                  <View style={[styles.miniOccupantAvatar, { backgroundColor: colors.teal }]}>
                    <Text style={styles.miniOccupantInitial}>S</Text>
                  </View>
                  <View>
                    <Text style={styles.miniOccupantName}>Sneha M.</Text>
                    <Text style={styles.miniOccupantRole}>Google Techie</Text>
                  </View>
                </View>
              </View>

              {/* Slot 3: Interactive Seat */}
              <Pressable
                accessibilityLabel="Toggle Seat 3 selection"
                accessibilityRole="button"
                onPress={() => toggleSeat(3)}
                style={[
                  styles.seatSlotInteractive,
                  selectedSeatSlots.includes(3) && styles.seatSlotSelected,
                ]}
              >
                <View style={styles.seatSlotTop}>
                  <Text style={[styles.seatSlotLabel, selectedSeatSlots.includes(3) && styles.seatSlotLabelSelected]}>
                    Seat 3 · Rear Left
                  </Text>
                  <AppIcon
                    color={selectedSeatSlots.includes(3) ? colors.appPrimary : '#9ca3af'}
                    name={selectedSeatSlots.includes(3) ? 'check' : 'plus'}
                    size={18}
                  />
                </View>
                <View>
                  <Text style={[styles.seatStatusText, selectedSeatSlots.includes(3) && styles.seatStatusTextSelected]}>
                    {selectedSeatSlots.includes(3) ? 'Selected for You' : 'Available'}
                  </Text>
                  <Text style={styles.seatTapPrompt}>
                    {selectedSeatSlots.includes(3) ? 'Tap to deselect' : 'Tap to select'}
                  </Text>
                </View>
              </Pressable>

              {/* Slot 4: Interactive Seat */}
              <Pressable
                accessibilityLabel="Toggle Seat 4 selection"
                accessibilityRole="button"
                onPress={() => toggleSeat(4)}
                style={[
                  styles.seatSlotInteractive,
                  selectedSeatSlots.includes(4) && styles.seatSlotSelected,
                ]}
              >
                <View style={styles.seatSlotTop}>
                  <Text style={[styles.seatSlotLabel, selectedSeatSlots.includes(4) && styles.seatSlotLabelSelected]}>
                    Seat 4 · Rear Right
                  </Text>
                  <AppIcon
                    color={selectedSeatSlots.includes(4) ? colors.appPrimary : '#9ca3af'}
                    name={selectedSeatSlots.includes(4) ? 'check' : 'plus'}
                    size={18}
                  />
                </View>
                <View>
                  <Text style={[styles.seatStatusText, selectedSeatSlots.includes(4) && styles.seatStatusTextSelected]}>
                    {selectedSeatSlots.includes(4) ? 'Selected for You' : 'Available'}
                  </Text>
                  <Text style={styles.seatTapPrompt}>
                    {selectedSeatSlots.includes(4) ? 'Tap to deselect' : 'Tap to select'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* ── Community Fuel Split Card ───────────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeading}>Community Fuel Split</Text>
              <View style={styles.passSelector}>
                <View style={styles.passBtnActive}>
                  <Text style={styles.passBtnActiveText}>1 Ride</Text>
                </View>
                <View style={styles.passBtn}>
                  <Text style={styles.passBtnText}>5-Day Pass ($25)</Text>
                </View>
              </View>
            </View>

            <View style={styles.pricingHeadline}>
              <Text style={styles.pricingBigNumber}>${numericCost}</Text>
              <Text style={styles.pricingBigUnit}>/ person per ride</Text>
            </View>

            <View style={styles.feeBreakdown}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Base fuel reimbursement</Text>
                <Text style={styles.feeValue}>${numericCost.toFixed(2)}</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Mopac toll express lane pass</Text>
                <Text style={[styles.feeValue, { color: colors.teal }]}>Included ($0.00)</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>ManaBandhu community fee</Text>
                <Text style={[styles.feeValue, { color: colors.teal }]}>Zero Fee ($0.00)</Text>
              </View>
              <View style={[styles.feeRow, styles.feeTotalRow]}>
                <Text style={styles.feeTotalLabel}>
                  Total to pay driver ({selectedSeatSlots.length} seat{selectedSeatSlots.length > 1 ? 's' : ''})
                </Text>
                <Text style={styles.feeTotalValue}>${totalCost}</Text>
              </View>
            </View>

            <View style={styles.guaranteePill}>
              <AppIcon color={colors.teal} name="verified-user" size={15} />
              <Text style={styles.guaranteeText}>
                100% Employer Verified Carpools · Zero Surge Guarantee
              </Text>
            </View>
          </View>

          {/* ── Community Safety Protocol Card ──────────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.safetyHeader}>
              <AppIcon color={colors.appPrimary} name="shield" size={18} />
              <Text style={styles.safetyTitle}>ManaBandhu Safety & Trust Protocol</Text>
            </View>
            <View style={styles.safetyItems}>
              <View style={styles.safetyItem}>
                <View style={styles.safetyCheckCircle}>
                  <AppIcon color={colors.teal} name="check" size={12} />
                </View>
                <Text style={styles.safetyItemText}>
                  Corporate Email Verified:{' '}
                  <Text style={styles.safetyItemHighlight}>{detailData.driverCorporateEmail}</Text>
                </Text>
              </View>
              <View style={styles.safetyItem}>
                <View style={styles.safetyCheckCircle}>
                  <AppIcon color={colors.teal} name="check" size={12} />
                </View>
                <Text style={styles.safetyItemText}>
                  Texas Driver License & Clean Driving Record
                </Text>
              </View>
              <View style={styles.safetyItem}>
                <View style={styles.safetyCheckCircle}>
                  <AppIcon color={colors.teal} name="check" size={12} />
                </View>
                <Text style={styles.safetyItemText}>
                  Live GPS sharing & SOS with trusted contacts
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Action Bar ────────────────────────────────────────── */}
      <View style={[styles.bottomBar, isDesktop && styles.bottomBarDesktop]}>
        <View style={styles.bottomBarLeft}>
          <Text style={styles.bottomBarTotal}>${totalCost}</Text>
          <Text style={styles.bottomBarSeatCount}>
            for {selectedSeatSlots.length} seat{selectedSeatSlots.length > 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.bottomBarRight}>
          <Pressable
            accessibilityLabel={`Chat with ${detailData.driverName}`}
            accessibilityRole="button"
            onPress={() => router.push(`/chat?recipient=${encodeURIComponent(detailData.driverName)}` as Href)}
            style={styles.bottomBarChatBtn}
          >
            <AppIcon color={colors.appPrimary} name="message" size={20} />
          </Pressable>

          <Pressable
            accessibilityLabel="Request Seat"
            accessibilityRole="button"
            onPress={handleRequestSeat}
            style={styles.bottomBarRequestBtn}
          >
            <AppIcon color={colors.surfaceContainerLowest} name="check" size={18} />
            <Text style={styles.bottomBarRequestText}>Request Seat</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Seat Request Confirmation Modal ─────────────────────────────────── */}
      <Modal
        animationType="fade"
        onRequestClose={() => setShowBookingModal(false)}
        transparent
        visible={showBookingModal}
      >
        <Pressable onPress={() => setShowBookingModal(false)} style={styles.modalOverlay}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.bookingModalCard}>
            {bookingSuccess ? (
              <View style={styles.bookingSuccessBox}>
                <View style={styles.bookingSuccessIconWrap}>
                  <AppIcon color={colors.teal} name="check" size={28} />
                </View>
                <Text style={styles.bookingSuccessTitle}>Seat Request Confirmed!</Text>
                <Text style={styles.bookingSuccessSubtitle}>
                  You booked {selectedSeatSlots.length} seat(s) with {detailData.driverName}.
                </Text>
                <Text style={styles.bookingSuccessDetails}>
                  Pickup: {detailData.pickupExact} at {detailData.pickupTime}. Driver has been notified via WhatsApp & ManaBandhu chat.
                </Text>
                <Pressable
                  onPress={() => {
                    setShowBookingModal(false);
                    router.push('/rides' as Href);
                  }}
                  style={styles.bookingSuccessCta}
                >
                  <Text style={styles.bookingSuccessCtaText}>Return to Carpools</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.bookingConfirmBox}>
                <View style={styles.bookingConfirmHeader}>
                  <Text style={styles.bookingConfirmTitle}>Confirm Seat Request</Text>
                  <Pressable onPress={() => setShowBookingModal(false)}>
                    <Text style={{ fontSize: 16, color: colors.inkSecondary }}>✕</Text>
                  </Pressable>
                </View>

                <View style={styles.bookingSummaryRow}>
                  <View>
                    <Text style={styles.bookingSummaryDriver}>{detailData.driverName} ({detailData.driverEmployer})</Text>
                    <Text style={styles.bookingSummaryRoute}>{detailData.originArea} ➔ {detailData.destinationArea}</Text>
                    <Text style={styles.bookingSummaryTime}>Departure: {detailData.pickupTime}</Text>
                  </View>
                  <View style={styles.bookingSummaryPriceBox}>
                    <Text style={styles.bookingSummaryPrice}>${totalCost}</Text>
                    <Text style={styles.bookingSummarySeats}>{selectedSeatSlots.length} seat(s)</Text>
                  </View>
                </View>

                <View style={styles.trustNote}>
                  <AppIcon color={colors.teal} name="verified-user" size={16} />
                  <Text style={styles.trustNoteText}>
                    Community Fuel Split is handed to the driver directly upon boarding.
                  </Text>
                </View>

                <Pressable
                  accessibilityLabel="Confirm and Reserve Seat"
                  accessibilityRole="button"
                  disabled={bookingMutation.isPending}
                  onPress={() => bookingMutation.mutate()}
                  style={styles.bookingConfirmBtn}
                >
                  {bookingMutation.isPending ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <AppIcon color={colors.surfaceContainerLowest} name="check" size={18} />
                      <Text style={styles.bookingConfirmBtnText}>Confirm and Reserve Seat</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
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
    maxWidth: 800,
    width: '100%',
  },
  topBarLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  backIconButton: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  titleWithEmblem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  screenTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  topBarRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,105,107,0.1)',
    borderColor: 'rgba(0,105,107,0.2)',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusDot: {
    backgroundColor: colors.teal,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  statusPillText: {
    color: colors.teal,
    fontSize: 10,
    fontWeight: '700',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  mainContainer: {
    gap: space.x3,
    paddingHorizontal: space.x4,
    paddingTop: space.x3,
  },
  mainContainerDesktop: {
    alignSelf: 'center',
    maxWidth: 800,
    width: '100%',
  },

  // Generic Card
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 24,
    borderWidth: 1,
    padding: space.x4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeading: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },

  // Driver Card
  driverHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  driverProfileLeft: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  driverAvatarCircle: {
    alignItems: 'center',
    backgroundColor: colors.appPrimary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    position: 'relative',
    width: 48,
  },
  driverAvatarInitial: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  verifiedDriverBadge: {
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
    fontSize: 15,
    fontWeight: '700',
  },
  staffBadge: {
    backgroundColor: '#eaedff',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  staffBadgeText: {
    color: colors.appPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  employerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  employerName: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '500',
  },
  ratingsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  starRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  ratingNumber: {
    color: colors.warm,
    fontSize: 12,
    fontWeight: '700',
  },
  ratingCount: {
    color: '#6b7280',
    fontSize: 11,
  },
  dotSeparator: {
    color: '#d1d5db',
  },
  onTimeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  onTimeText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: '600',
  },
  driverBadgeStack: {
    alignItems: 'flex-end',
    gap: 4,
  },
  fastReplyPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,105,107,0.1)',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  fastReplyText: {
    color: colors.teal,
    fontSize: 10,
    fontWeight: '700',
  },
  superCommuterPill: {
    backgroundColor: 'rgba(67,30,190,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  superCommuterText: {
    color: colors.appPrimary,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  quoteBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 10,
  },
  quoteText: {
    color: '#374151',
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // Route Timeline
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dateTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  dateSub: {
    color: '#6b7280',
    fontSize: 11,
  },
  durationBadge: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '600',
  },
  timelineContainer: {
    marginTop: 12,
    paddingLeft: 18,
    position: 'relative',
  },
  timelineTrack: {
    backgroundColor: colors.appPrimary,
    bottom: 20,
    left: 4,
    position: 'absolute',
    top: 10,
    width: 2,
  },
  timelineStop: {
    position: 'relative',
  },
  timelineBulletPickup: {
    backgroundColor: '#ffffff',
    borderColor: colors.appPrimary,
    borderRadius: 6,
    borderWidth: 3,
    height: 12,
    left: -19,
    position: 'absolute',
    top: 3,
    width: 12,
  },
  timelineBulletDropoff: {
    backgroundColor: '#ffffff',
    borderColor: colors.teal,
    borderRadius: 6,
    borderWidth: 3,
    height: 12,
    left: -19,
    position: 'absolute',
    top: 3,
    width: 12,
  },
  stopContent: {
    paddingBottom: 8,
  },
  stopHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stopTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  stopTimePrimary: {
    color: colors.appPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  stopTimeSecondary: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '800',
  },
  stopAddress: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
  },
  corridorHighlight: {
    alignItems: 'center',
    backgroundColor: 'rgba(67,30,190,0.06)',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
    marginVertical: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  corridorText: {
    color: colors.appPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  routeStatsBox: {
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  routeDistanceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  routeDistanceText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  trafficPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  trafficText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },

  // Vehicle Details
  sectionEyebrow: {
    color: '#9ca3af',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  vehicleTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  vehicleSubtitle: {
    color: '#6b7280',
    fontSize: 11,
  },
  carIconCircle: {
    alignItems: 'center',
    backgroundColor: '#eaedff',
    borderRadius: 16,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  amenityItem: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: '48%',
  },
  amenityIcon: {
    fontSize: 14,
  },
  amenityLabel: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '500',
  },
  ecoBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,105,107,0.1)',
    borderColor: 'rgba(0,105,107,0.2)',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    paddingVertical: 6,
  },
  ecoBadgeText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: '700',
  },

  // Vibes
  verifiedTag: {
    color: '#6b7280',
    fontSize: 11,
  },
  vibesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  vibePill: {
    backgroundColor: '#eaedff',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  vibePillText: {
    color: colors.appPrimary,
    fontSize: 11,
    fontWeight: '600',
  },

  // Capacity & Seats Grid
  capacitySub: {
    color: '#6b7280',
    fontSize: 11,
  },
  seatsAvailableBadge: {
    backgroundColor: 'rgba(0,105,107,0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  seatsAvailableText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: '700',
  },
  seatSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  seatSlotOccupied: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 16,
    borderWidth: 1,
    height: 84,
    justifyContent: 'space-between',
    padding: 10,
    width: '48%',
  },
  seatSlotInteractive: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 84,
    justifyContent: 'space-between',
    padding: 10,
    width: '48%',
  },
  seatSlotSelected: {
    backgroundColor: '#eaedff',
    borderColor: colors.appPrimary,
    borderStyle: 'solid',
  },
  seatSlotTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  seatSlotLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  seatSlotLabelSelected: {
    color: colors.appPrimary,
  },
  seatOccupant: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  miniOccupantAvatar: {
    alignItems: 'center',
    backgroundColor: colors.appPrimary,
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  miniOccupantInitial: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  miniOccupantName: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '700',
  },
  miniOccupantRole: {
    color: '#6b7280',
    fontSize: 9,
  },
  seatStatusText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
  },
  seatStatusTextSelected: {
    color: colors.appPrimary,
  },
  seatTapPrompt: {
    color: '#9ca3af',
    fontSize: 9,
  },

  // Fuel Split
  passSelector: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 2,
  },
  passBtnActive: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  passBtnActiveText: {
    color: colors.appPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  passBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  passBtnText: {
    color: '#6b7280',
    fontSize: 10,
  },
  pricingHeadline: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 4,
    marginVertical: 6,
  },
  pricingBigNumber: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
  },
  pricingBigUnit: {
    color: '#6b7280',
    fontSize: 12,
  },
  feeBreakdown: {
    borderTopColor: '#f3f4f6',
    borderTopWidth: 1,
    gap: 4,
    paddingTop: 8,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feeLabel: {
    color: '#6b7280',
    fontSize: 11,
  },
  feeValue: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '600',
  },
  feeTotalRow: {
    borderTopColor: '#f3f4f6',
    borderTopWidth: 1,
    marginTop: 6,
    paddingTop: 6,
  },
  feeTotalLabel: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  feeTotalValue: {
    color: colors.appPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  guaranteePill: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    padding: 8,
  },
  guaranteeText: {
    color: '#6b7280',
    fontSize: 10,
  },

  // Safety Section
  safetyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  safetyTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  safetyItems: {
    gap: 6,
  },
  safetyItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  safetyCheckCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,105,107,0.12)',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  safetyItemText: {
    color: '#374151',
    fontSize: 11,
  },
  safetyItemHighlight: {
    color: colors.appPrimary,
    fontWeight: '700',
  },

  // Sticky Bottom Bar
  bottomBar: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopColor: '#e5e7eb',
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  bottomBarDesktop: {
    alignSelf: 'center',
    maxWidth: 800,
    width: '100%',
  },
  bottomBarLeft: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 4,
  },
  bottomBarTotal: {
    color: colors.appPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  bottomBarSeatCount: {
    color: '#6b7280',
    fontSize: 11,
  },
  bottomBarRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  bottomBarChatBtn: {
    alignItems: 'center',
    backgroundColor: '#eaedff',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  bottomBarRequestBtn: {
    alignItems: 'center',
    backgroundColor: colors.appPrimary,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: colors.appPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bottomBarRequestText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: space.x4,
  },
  bookingModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    maxWidth: 440,
    overflow: 'hidden',
    width: '100%',
  },
  bookingConfirmBox: {
    padding: space.x4,
  },
  bookingConfirmHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bookingConfirmTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  bookingSummaryRow: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  bookingSummaryDriver: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  bookingSummaryRoute: {
    color: '#4b5563',
    fontSize: 11,
    marginTop: 2,
  },
  bookingSummaryTime: {
    color: colors.appPrimary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  bookingSummaryPriceBox: {
    alignItems: 'flex-end',
  },
  bookingSummaryPrice: {
    color: colors.appPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  bookingSummarySeats: {
    color: '#6b7280',
    fontSize: 10,
  },
  trustNote: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,105,107,0.08)',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
    padding: 10,
  },
  trustNoteText: {
    color: colors.teal,
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  bookingConfirmBtn: {
    alignItems: 'center',
    backgroundColor: colors.appPrimary,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  bookingConfirmBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  bookingSuccessBox: {
    alignItems: 'center',
    padding: 24,
  },
  bookingSuccessIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,105,107,0.12)',
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    marginBottom: 12,
    width: 56,
  },
  bookingSuccessTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  bookingSuccessSubtitle: {
    color: '#4b5563',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  bookingSuccessDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    color: '#6b7280',
    fontSize: 11,
    lineHeight: 16,
    marginVertical: 14,
    padding: 10,
    textAlign: 'center',
  },
  bookingSuccessCta: {
    backgroundColor: colors.appPrimary,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  bookingSuccessCtaText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Loading & Error States
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    color: '#4b5563',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 10,
    padding: 32,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.appPrimary,
    borderRadius: radius.pill,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 4,
    padding: 8,
  },
  backBtnText: {
    color: colors.appPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
});
