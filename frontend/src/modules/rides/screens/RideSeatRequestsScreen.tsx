import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listSeatRequests, updateSeatRequestStatus } from '@/modules/rides/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';

export function RideSeatRequestsScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const _router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rides', 'seat-requests', rideId],
    queryFn: () => listSeatRequests(rideId),
    enabled: Boolean(rideId),
  });

  const approve = useMutation({
    mutationFn: (requestId: string) => updateSeatRequestStatus(requestId, 'ACCEPTED'),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['rides', 'seat-requests', rideId] }),
  });

  const reject = useMutation({
    mutationFn: (requestId: string) => updateSeatRequestStatus(requestId, 'REJECTED'),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['rides', 'seat-requests', rideId] }),
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
          title="Unable to load seat requests"
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
          <Text style={styles.title}>Seat requests</Text>
          <Text style={styles.subtitle}>Review and manage seat requests for your ride.</Text>

          {data && data.length > 0 ? (
            data.map((request) => (
              <View key={request.id} style={styles.card}>
                <Text style={styles.cardTitle}>{request.requesterName}</Text>
                <Text style={styles.cardBody}>
                  {request.pickupArea} · {request.seatsRequested} seat(s)
                </Text>
                {request.message ? <Text style={styles.cardMeta}>"{request.message}"</Text> : null}
                <Text
                  style={[
                    styles.statusBadge,
                    request.status === 'PENDING' && styles.statusPending,
                    request.status === 'ACCEPTED' && styles.statusApproved,
                    request.status === 'REJECTED' && styles.statusRejected,
                  ]}
                >
                  {request.status}
                </Text>
                {request.status === 'PENDING' ? (
                  <View style={styles.cardActions}>
                    <AppButton
                      label="Approve"
                      onPress={() => approve.mutate(request.id)}
                      loading={approve.isPending}
                    />
                    <AppButton
                      label="Reject"
                      onPress={() => reject.mutate(request.id)}
                      variant="secondary"
                      loading={reject.isPending}
                    />
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No seat requests</Text>
              <Text style={styles.emptyBody}>
                Requests will appear here when riders ask for a seat.
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <AppButton label="Participants" route={`/rides/${rideId}/participants`} />
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
    gap: space.x2,
    padding: space.x4,
  },
  cardTitle: { ...typography.h4, color: colors.ink },
  cardBody: { ...typography.body, color: colors.muted },
  cardMeta: { ...typography.caption, color: colors.muted, fontStyle: 'italic' },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: space.x3,
    paddingVertical: space.x1,
    ...typography.caption,
    fontWeight: '700',
  },
  statusPending: { backgroundColor: colors.warning, color: colors.surface },
  statusApproved: { backgroundColor: colors.success, color: colors.surface },
  statusRejected: { backgroundColor: colors.error, color: colors.surface },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2, marginTop: space.x2 },
  emptyState: { alignItems: 'center', gap: space.x2, padding: space.x6 },
  emptyTitle: { ...typography.h3, color: colors.ink, textAlign: 'center' },
  emptyBody: { ...typography.body, color: colors.muted, textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
});
