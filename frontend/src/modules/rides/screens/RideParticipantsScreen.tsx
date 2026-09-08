import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listParticipants } from '@/modules/rides/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Avatar, AvatarFallbackText } from '@/modules/shared/ui/gluestack/avatar';

export function RideParticipantsScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rides', 'participants', rideId],
    queryFn: () => listParticipants(rideId),
    enabled: Boolean(rideId),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load participants"
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
          <Text style={styles.title}>Participants</Text>
          <Text style={styles.subtitle}>View confirmed participants and trip sharing status.</Text>

          {data && data.length > 0 ? (
            data.map((participant) => (
              <View key={participant.id} style={styles.card}>
                <Avatar className="h-12 w-12 bg-primary">
                  <AvatarFallbackText className="text-primary-foreground">
                    {participant.name.slice(0, 2).toUpperCase()}
                  </AvatarFallbackText>
                </Avatar>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{participant.name}</Text>
                  <Text style={styles.cardMeta}>
                    {participant.role === 'DRIVER' ? 'Driver' : 'Rider'} ·{' '}
                    {participant.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                    {participant.tripShared ? ' · trip shared' : ''}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No participants yet</Text>
              <Text style={styles.emptyBody}>
                Participants will appear here once seat requests are approved.
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <AppButton label="Seat requests" route={`/rides/${rideId}/seat-requests`} />
            <AppButton label="Manage ride" route={`/rides/${rideId}/manage`} variant="secondary" />
          </View>
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
    flexDirection: 'row',
    gap: space.x3,
    alignItems: 'center',
    padding: space.x4,
  },
  cardBody: { flex: 1, gap: space.x1 },
  cardTitle: { ...typography.h4, color: colors.ink },
  cardMeta: { ...typography.caption, color: colors.muted },
  emptyState: { alignItems: 'center', gap: space.x2, padding: space.x6 },
  emptyTitle: { ...typography.h3, color: colors.ink, textAlign: 'center' },
  emptyBody: { ...typography.body, color: colors.muted, textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
});
