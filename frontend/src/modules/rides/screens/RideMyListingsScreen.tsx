import {
  color as colors,
  contentWidth,
  radius,
  space,
  typography,
} from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyRides } from '@/modules/rides/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function RideMyListingsScreen() {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const maxWidth = layout.windowClass === 'compact' ? contentWidth.compact : layout.maxContentWidth;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rides', 'mine'],
    queryFn: getMyRides,
  });

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth }]}>
          <SectionHeader title="My rides" subtitle="Manage your offered rides and seat requests." />
          {isLoading ? (
            <LoadingState />
          ) : data && data.length > 0 ? (
            data.map((ride) => (
              <View key={ride.id} style={styles.card}>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{ride.title}</Text>
                  <Text style={styles.cardSubtitle}>
                    {ride.pickupArea} → {ride.destination}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {`$${ride.contribution ?? 0} · ${ride.seatsAvailable} seats · ${ride.status}`}
                  </Text>
                </View>
                <View style={styles.cardActions}>
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
              <Text style={styles.emptyTitle}>No rides offered yet</Text>
              <Text style={styles.emptyBody}>
                Offer a ride to help community members travel safely.
              </Text>
              <AppButton label="Offer a ride" onPress={() => router.push('/rides/offer')} />
            </View>
          )}
          <View style={styles.actions}>
            <AppButton label="Offer a ride" route="/rides/offer" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x6, width: '100%' },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.x3,
    padding: space.x4,
  },
  cardBody: { gap: space.x1 },
  cardTitle: { ...typography.h4, color: colors.ink },
  cardSubtitle: { ...typography.body, color: colors.muted },
  cardMeta: { ...typography.caption, color: colors.primary },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
  emptyState: { alignItems: 'center', gap: space.x3, padding: space.x6 },
  emptyTitle: { ...typography.h3, color: colors.ink, textAlign: 'center' },
  emptyBody: { ...typography.body, color: colors.muted, textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
});
