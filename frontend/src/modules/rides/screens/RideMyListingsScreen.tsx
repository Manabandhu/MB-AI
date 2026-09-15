import {
  color as colors,
  contentWidth,
  radius,
  space,
  typography,
} from '@manabandhu/design-system';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getMyRides, reactivateRideOffer, updateRideStatus } from '@/modules/rides/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function RideMyListingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const layout = useAdaptiveLayout();
  const maxWidth = layout.windowClass === 'compact' ? contentWidth.compact : layout.maxContentWidth;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => sub.remove();
  }, [router]);

  const [activeTab, setActiveTab] = useState<'all' | 'recurring'>('all');
  const [cloningId, setCloningId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rides', 'mine'],
    queryFn: getMyRides,
  });

  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const handleToggleStatus = async (rideId: string, currentStatus: string) => {
    try {
      setStatusUpdatingId(rideId);
      const isCurrentlyActive =
        currentStatus === 'ACTIVE' || currentStatus === 'OPEN' || currentStatus === 'IN_PROGRESS';
      const nextStatus = isCurrentlyActive ? 'CANCELLED' : 'ACTIVE';
      await updateRideStatus(rideId, nextStatus);
      queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      Alert.alert(
        isCurrentlyActive ? 'Ride Deactivated ⏸️' : 'Ride Activated 🟢',
        isCurrentlyActive
          ? 'Ride has been deactivated and removed from discovery feeds.'
          : 'Ride is now active and searchable for seat bookings.',
      );
    } catch (e: unknown) {
      Alert.alert('Status Update Failed', (e as Error)?.message || 'Unable to update ride status.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleReactivate = async (rideId: string) => {
    try {
      setCloningId(rideId);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const cloned = await reactivateRideOffer(rideId, tomorrow);
      queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      Alert.alert(
        'Ride Re-activated! 🚗',
        'Your trip has been cloned for tomorrow with same route, vehicle, and toll settings.',
        [
          { text: 'View Offer', onPress: () => router.push(`/rides/${cloned.id}`) },
          { text: 'OK', style: 'cancel' },
        ],
      );
    } catch (e: unknown) {
      Alert.alert('Re-activation Failed', (e as Error)?.message || 'Unable to re-activate ride.');
    } finally {
      setCloningId(null);
    }
  };

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load your rides"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const rides = data || [];
  const filteredRides =
    activeTab === 'recurring'
      ? rides.filter(
          (r) =>
            r.isRecurring || r.recurrencePattern === 'WEEKDAYS' || r.recurrencePattern === 'DAILY',
        )
      : rides;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.page, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]}
      >
        <View style={[styles.container, { maxWidth }]}>
          <View style={styles.headerBar}>
            <Pressable
              accessibilityLabel="Back to Rides"
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <AppIcon color={colors.ink} name="chevron-left" size={20} />
            </Pressable>
            <Text style={styles.headerBarTitle}>My Rides & Commutes</Text>
          </View>
          <SectionHeader
            title="My Rides & Commutes"
            subtitle="Manage your offered carpools, active commute routes, and seat bookings."
          />

          {/* Tab Selector: All Rides vs Active Commutes */}
          <View style={styles.tabBar}>
            <Pressable
              style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'all' && styles.tabBtnTextActive]}>
                All Rides ({rides.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, activeTab === 'recurring' && styles.tabBtnActive]}
              onPress={() => setActiveTab('recurring')}
            >
              <Text
                style={[styles.tabBtnText, activeTab === 'recurring' && styles.tabBtnTextActive]}
              >
                Active Commutes (Recurring)
              </Text>
            </Pressable>
          </View>

          {isLoading ? (
            <LoadingState />
          ) : filteredRides.length > 0 ? (
            filteredRides.map((ride) => (
              <View key={ride.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{ride.title}</Text>
                    <Text style={styles.cardSubtitle}>
                      {ride.pickupArea} → {ride.destination}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      ride.status === 'COMPLETED'
                        ? styles.statusCompleted
                        : ride.status === 'IN_PROGRESS'
                          ? styles.statusInProgress
                          : styles.statusActive,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{ride.status}</Text>
                  </View>
                </View>

                {/* Badges: Recurrence, Toll Preference, Departure */}
                <View style={styles.badgeRow}>
                  {ride.isRecurring && (
                    <View style={styles.recurrencePill}>
                      <Text style={styles.recurrenceText}>
                        🔄{' '}
                        {ride.recurrencePattern === 'WEEKDAYS' ? 'Weekdays (M–F)' : 'Daily Commute'}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.tollPill,
                      ride.tollPreference === 'AVOID_TOLLS' ? styles.tollFree : styles.tollIncluded,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tollText,
                        ride.tollPreference === 'AVOID_TOLLS'
                          ? styles.tollFreeText
                          : styles.tollIncludedText,
                      ]}
                    >
                      {ride.tollPreference === 'AVOID_TOLLS'
                        ? '🚫 Free Route (No Tolls)'
                        : '🛣️ Tollway'}
                    </Text>
                  </View>
                  <Text style={styles.metaText}>
                    ${ride.contribution ?? 0} • {ride.seatsAvailable} seats left
                  </Text>
                </View>

                {/* 1-Tap Activate / Deactivate Toggle Row */}
                {(() => {
                  const isRideActive =
                    (ride.status as string) === 'ACTIVE' || (ride.status as string) === 'OPEN';
                  return (
                    <View style={styles.statusToggleRow}>
                      <View style={styles.statusPillWrap}>
                        <View
                          style={[
                            styles.statusDot,
                            isRideActive ? styles.statusDotActive : styles.statusDotPaused,
                          ]}
                        />
                        <Text style={styles.statusPillText}>
                          {isRideActive
                            ? '🟢 Active & Searchable'
                            : ride.status === 'IN_PROGRESS'
                              ? '🚗 Trip in Progress'
                              : '⏸️ Deactivated'}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityLabel={
                          isRideActive ? 'Deactivate carpool' : 'Activate carpool'
                        }
                        accessibilityRole="button"
                        disabled={statusUpdatingId === ride.id}
                        onPress={() => handleToggleStatus(ride.id, ride.status)}
                        style={[
                          styles.toggleStatusBtn,
                          isRideActive
                            ? styles.toggleStatusBtnDeactivate
                            : styles.toggleStatusBtnActivate,
                        ]}
                      >
                        {statusUpdatingId === ride.id ? (
                          <ActivityIndicator size="small" color="#431ebe" />
                        ) : (
                          <Text
                            style={[
                              styles.toggleStatusBtnText,
                              isRideActive
                                ? styles.toggleStatusBtnTextDeactivate
                                : styles.toggleStatusBtnTextActivate,
                            ]}
                          >
                            {isRideActive ? '⏸️ Deactivate' : '🟢 Activate'}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  );
                })()}

                {/* Card Action Buttons */}
                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.repostBtn}
                    disabled={cloningId === ride.id}
                    onPress={() => handleReactivate(ride.id)}
                  >
                    {cloningId === ride.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <AppIcon name="sparks" size={14} color={colors.primary} />
                        <Text style={styles.repostBtnText}>Repeat Trip Tomorrow</Text>
                      </>
                    )}
                  </Pressable>

                  <AppButton
                    label="Manage"
                    onPress={() => router.push(`/rides/${ride.id}/manage`)}
                    variant="secondary"
                  />
                  <AppButton
                    label="Seats"
                    onPress={() => router.push(`/rides/${ride.id}/seat-requests`)}
                    variant="ghost"
                  />
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <AppIcon name="car" size={36} color={colors.muted} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'recurring'
                  ? 'No recurring commutes active'
                  : 'No rides offered yet'}
              </Text>
              <Text style={styles.emptyBody}>
                {activeTab === 'recurring'
                  ? 'Set up a recurring daily commute to automatically schedule rides with coworkers and neighbors.'
                  : 'Offer a ride to help community members travel safely.'}
              </Text>
              <AppButton label="Offer a ride" onPress={() => router.push('/rides/offer')} />
            </View>
          )}

          <View style={styles.bottomActions}>
            <AppButton label="Offer New Ride" route="/rides/offer" />
            <AppButton
              label="View Ride History"
              onPress={() => router.push('/rides/history')}
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x5, width: '100%' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#eceef8',
    borderRadius: radius.control,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: space.x2,
    alignItems: 'center',
    borderRadius: radius.control,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tabBtnText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  tabBtnTextActive: { color: colors.primary, fontWeight: '800' },

  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.x3,
    padding: space.x4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.x2,
  },
  cardTitle: { ...typography.h4, color: colors.ink, fontWeight: '800' },
  cardSubtitle: { ...typography.body, color: colors.muted },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  statusActive: { backgroundColor: 'rgba(16,185,129,0.12)' },
  statusInProgress: { backgroundColor: 'rgba(255,126,51,0.12)' },
  statusCompleted: { backgroundColor: 'rgba(107,114,128,0.12)' },
  statusBadgeText: { fontSize: 11, fontWeight: '800', color: colors.ink },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  recurrencePill: {
    backgroundColor: 'rgba(0,105,107,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  recurrenceText: { color: colors.teal, fontSize: 11, fontWeight: '700' },
  tollPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  tollFree: { backgroundColor: 'rgba(16,185,129,0.12)' },
  tollIncluded: { backgroundColor: 'rgba(255,126,51,0.12)' },
  tollText: { fontSize: 11, fontWeight: '700' },
  tollFreeText: { color: '#059669' },
  tollIncludedText: { color: colors.warm },
  metaText: { fontSize: 12, color: colors.muted, fontWeight: '600' },

  statusToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#faf8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#eaedff',
  },
  statusPillWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: '#16a34a',
  },
  statusDotPaused: {
    backgroundColor: '#9ca3af',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  toggleStatusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  toggleStatusBtnActivate: {
    backgroundColor: 'rgba(22,163,74,0.12)',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  toggleStatusBtnDeactivate: {
    backgroundColor: 'rgba(156,163,175,0.15)',
    borderWidth: 1,
    borderColor: '#9ca3af',
  },
  toggleStatusBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  toggleStatusBtnTextActivate: {
    color: '#16a34a',
  },
  toggleStatusBtnTextDeactivate: {
    color: '#4b5563',
  },

  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.x2,
    paddingTop: 4,
  },
  repostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(67,30,190,0.08)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: space.x3,
    paddingVertical: space.x2,
    borderRadius: radius.control,
  },
  repostBtnText: { color: colors.primary, fontSize: 12, fontWeight: '800' },

  emptyState: { alignItems: 'center', gap: space.x3, padding: space.x6 },
  emptyTitle: { ...typography.h3, color: colors.ink, textAlign: 'center' },
  emptyBody: { ...typography.body, color: colors.muted, textAlign: 'center' },
  bottomActions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
    marginBottom: space.x2,
  },
  headerBarTitle: {
    ...typography.h3,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(67,30,190,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
