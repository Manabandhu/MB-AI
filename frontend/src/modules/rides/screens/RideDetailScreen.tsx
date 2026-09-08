import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/authStore';
import { getRideDetail, saveRide, unsaveRide } from '@/modules/rides/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';

export function RideDetailScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = status === 'authenticated';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rides', 'detail', rideId],
    queryFn: () => getRideDetail(rideId as string),
    enabled: Boolean(rideId),
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (data?.savedByViewer) {
        await unsaveRide(rideId as string);
      } else {
        await saveRide(rideId as string);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides', 'detail', rideId] });
      queryClient.invalidateQueries({ queryKey: ['rides', 'saved'] });
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load ride"
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
          <Text style={styles.eyebrow}>Ride</Text>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.route}>
            {data.pickupArea} to {data.destination}
          </Text>
          <Text style={styles.schedule}>
            {new Date(data.departureAt).toLocaleString()} · {data.seatsAvailable} seats open
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Trip details</Text>
            <DetailRow label="Seats" value={`${data.seatsAvailable} / ${data.seatsTotal} open`} />
            <DetailRow
              label="Contribution"
              value={data.contribution ? `$${data.contribution}` : 'Free'}
            />
            <DetailRow label="Luggage" value={data.luggageAllowed ? 'Allowed' : 'Not allowed'} />
            <DetailRow
              label="Child seat"
              value={data.childSeatAvailable ? 'Available' : 'Not available'}
            />
            <DetailRow label="Verified driver" value={data.verifiedDriver ? 'Yes' : 'No'} />
          </View>

          {data.description ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Description</Text>
              <Text style={styles.cardBody}>{data.description}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              label={data.savedByViewer ? 'Saved' : 'Save ride'}
              onPress={() => isAuthenticated && toggleSave.mutate()}
              variant={data.savedByViewer ? 'secondary' : 'primary'}
              loading={toggleSave.isPending}
              disabled={!isAuthenticated}
            />
            <AppButton label="Request seat" route={`/rides/request`} variant="secondary" />
            <AppButton label="Back to search" onPress={() => router.back()} variant="ghost" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x5, maxWidth: 640, width: '100%' },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  title: { ...typography.h1, color: colors.ink },
  route: { ...typography.h3, color: colors.ink },
  schedule: { ...typography.body, color: colors.muted, marginBottom: space.x2 },
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space.x1,
  },
  detailLabel: { ...typography.body, color: colors.muted },
  detailValue: { ...typography.bodyStrong, color: colors.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
});
