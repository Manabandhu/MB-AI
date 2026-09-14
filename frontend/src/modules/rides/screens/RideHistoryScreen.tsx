import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRideHistory, reactivateRideOffer } from '@/modules/rides/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

export function RideHistoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reActivatingId, setReActivatingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rides', 'history'],
    queryFn: getRideHistory,
  });

  const handleReactivate = async (rideId: string) => {
    try {
      setReActivatingId(rideId);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const cloned = await reactivateRideOffer(rideId, tomorrow);
      queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['rides', 'history'] });
      Alert.alert(
        'Trip Re-activated! 🚗',
        'Past ride has been cloned with fresh active status for tomorrow.',
        [
          { text: 'View New Offer', onPress: () => router.push(`/rides/${cloned.id}`) },
          { text: 'Go to My Rides', onPress: () => router.push('/rides/mine') },
        ],
      );
    } catch (e: any) {
      Alert.alert('Re-activation Failed', e?.message || 'Unable to re-activate ride.');
    } finally {
      setReActivatingId(null);
    }
  };

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load ride history"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>Past Carpools</Text>
          <Text style={styles.title}>Ride History</Text>
          <Text style={styles.subtitle}>
            Review completed trips, submit ratings, or re-activate past routes in 1 click.
          </Text>

          {isLoading ? (
            <LoadingState />
          ) : data && data.length > 0 ? (
            data.map((ride) => (
              <View key={ride.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{ride.title}</Text>
                    <Text style={styles.cardSubtitle}>
                      {ride.pickupArea} → {ride.destination}
                    </Text>
                    <Text style={styles.cardMeta}>
                      📅 {new Date(ride.departureAt).toLocaleDateString()} • {ride.status}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{ride.status}</Text>
                  </View>
                </View>

                {/* Actions: Re-activate Trip (1-Click) + Rate */}
                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.reactivateBtn}
                    disabled={reActivatingId === ride.id}
                    onPress={() => handleReactivate(ride.id)}
                  >
                    {reActivatingId === ride.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <AppIcon name="sparks" size={14} color="#ffffff" />
                        <Text style={styles.reactivateBtnText}>Re-activate Trip</Text>
                      </>
                    )}
                  </Pressable>

                  <AppButton
                    label="Rate Experience"
                    onPress={() => router.push(`/rides/${ride.id}/rate`)}
                    variant="secondary"
                  />
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <AppIcon name="car" size={36} color={colors.muted} />
              <Text style={styles.emptyTitle}>No ride history</Text>
              <Text style={styles.emptyBody}>Completed rides will appear here.</Text>
              <AppButton label="Browse rides" onPress={() => router.push('/rides/search')} />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x5, maxWidth: 640, width: '100%' },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  title: { ...typography.h1, color: colors.ink },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: space.x4 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.x3,
    padding: space.x4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.x2,
  },
  cardTitle: { ...typography.h4, color: colors.ink, fontWeight: '800' },
  cardSubtitle: { ...typography.body, color: colors.muted },
  cardMeta: { ...typography.caption, color: colors.primary, marginTop: 4 },
  statusBadge: {
    backgroundColor: 'rgba(107,114,128,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '800', color: colors.muted },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.x2,
    paddingTop: 4,
  },
  reactivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
    borderRadius: radius.control,
  },
  reactivateBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  emptyState: { alignItems: 'center', gap: space.x3, padding: space.x6 },
  emptyTitle: { ...typography.h3, color: colors.ink, textAlign: 'center' },
  emptyBody: { ...typography.body, color: colors.muted, textAlign: 'center' },
});
