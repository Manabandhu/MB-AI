import { color as colors, space, typography } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRideForOwner, updateRideOffer } from '@/modules/rides/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

export function RideManageScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [seats, setSeats] = useState('');
  const [contribution, setContribution] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rides', 'owner', rideId],
    queryFn: () => getRideForOwner(rideId),
    enabled: Boolean(rideId),
  });

  const mutation = useMutation({
    mutationFn: (input: { seatsAvailable?: number; contribution?: number }) =>
      updateRideOffer(rideId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides', 'owner', rideId] });
      queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] });
      setSuccess(true);
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit() {
    setError(null);
    const input: { seatsAvailable?: number; contribution?: number } = {};
    if (seats.trim()) input.seatsAvailable = parseInt(seats, 10);
    if (contribution.trim()) input.contribution = parseFloat(contribution);
    if (Object.keys(input).length === 0) {
      setError('Enter at least one field to update.');
      return;
    }
    mutation.mutate(input);
  }

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
          <Text style={styles.eyebrow}>Rides</Text>
          <Text style={styles.title}>Manage ride</Text>
          <Text style={styles.subtitle}>{data.title}</Text>

          {success ? <Text style={styles.successText}>Ride updated</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Seats available</Text>
              <Input className="min-h-14 rounded-xl bg-secondary/70">
                <InputField
                  placeholder={`Current: ${data.seatsAvailable}`}
                  keyboardType="number-pad"
                  value={seats}
                  onChangeText={setSeats}
                />
              </Input>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contribution ($)</Text>
              <Input className="min-h-14 rounded-xl bg-secondary/70">
                <InputField
                  placeholder={data.contribution ? `$${data.contribution}` : 'Optional'}
                  keyboardType="decimal-pad"
                  value={contribution}
                  onChangeText={setContribution}
                />
              </Input>
            </View>
            <View style={styles.actions}>
              <AppButton label="Save changes" onPress={handleSubmit} loading={mutation.isPending} />
              <AppButton
                label="View details"
                onPress={() => router.push(`/rides/${rideId}`)}
                variant="secondary"
              />
              <AppButton
                label="Participants"
                route={`/rides/${rideId}/participants`}
                variant="secondary"
              />
            </View>
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
  form: { gap: space.x4 },
  inputGroup: { gap: space.x2 },
  inputLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
  errorText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  successText: { color: colors.success, fontSize: 14, fontWeight: '700' },
});
