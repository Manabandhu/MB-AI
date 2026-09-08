import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRideHistory } from '@/modules/rides/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';

export function RideHistoryScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rides', 'history'],
    queryFn: getRideHistory,
  });

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
          <Text style={styles.eyebrow}>Rides</Text>
          <Text style={styles.title}>Ride history</Text>
          <Text style={styles.subtitle}>View past rides and rate your experiences.</Text>

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
                    {new Date(ride.departureAt).toLocaleDateString()} · {ride.status}
                  </Text>
                </View>
                <AppButton
                  label="Rate"
                  onPress={() => router.push(`/rides/${ride.id}/rate`)}
                  variant="secondary"
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
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
  cardBody: { gap: space.x1 },
  cardTitle: { ...typography.h4, color: colors.ink },
  cardSubtitle: { ...typography.body, color: colors.muted },
  cardMeta: { ...typography.caption, color: colors.primary },
  emptyState: { alignItems: 'center', gap: space.x3, padding: space.x6 },
  emptyTitle: { ...typography.h3, color: colors.ink, textAlign: 'center' },
  emptyBody: { ...typography.body, color: colors.muted, textAlign: 'center' },
});
