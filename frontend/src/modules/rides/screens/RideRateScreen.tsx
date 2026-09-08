import { color as colors, space, typography } from '@manabandhu/design-system';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRideDetail, getRideRating, submitRideRating } from '@/modules/rides/api';
import type { CreateRideRatingInput } from '@/modules/rides/types';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { StarRating } from '@/modules/shared/components/StarRating';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

export function RideRateScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const [safety, setSafety] = useState(0);
  const [timeliness, setTimeliness] = useState(0);
  const [comfort, setComfort] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: ride, isLoading: loadingRide } = useQuery({
    queryKey: ['rides', 'detail', rideId],
    queryFn: () => getRideDetail(rideId),
    enabled: Boolean(rideId),
  });

  const { data: existingRating } = useQuery({
    queryKey: ['rides', 'rating', rideId],
    queryFn: () => getRideRating(rideId),
    enabled: Boolean(rideId),
  });

  const mutation = useMutation({
    mutationFn: (input: {
      safetyRating: number;
      timelinessRating: number;
      comfortRating: number;
      comment?: string;
    }) => submitRideRating(rideId, input as CreateRideRatingInput),
    onSuccess: () => setSuccess(true),
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit() {
    setError(null);
    if (safety === 0 || timeliness === 0 || comfort === 0) {
      setError('Please rate all three categories.');
      return;
    }
    mutation.mutate({
      safetyRating: safety,
      timelinessRating: timeliness,
      comfortRating: comfort,
      comment: comment.trim() || undefined,
    });
  }

  if (loadingRide) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (existingRating && !success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.successTitle}>Already rated</Text>
          <Text style={styles.successBody}>
            You have already rated this ride. Thank you for your feedback.
          </Text>
          <AppButton label="Ride history" onPress={() => router.replace('/rides/history')} />
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.successTitle}>Thank you for rating</Text>
          <Text style={styles.successBody}>Your feedback helps build trust in the community.</Text>
          <AppButton label="Ride history" onPress={() => router.replace('/rides/history')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>Rides</Text>
          <Text style={styles.title}>Rate ride</Text>
          <Text style={styles.subtitle}>Share feedback on safety, timeliness, and comfort.</Text>

          {ride ? <Text style={styles.rideInfo}>{ride.title}</Text> : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.form}>
            <View style={styles.ratingGroup}>
              <Text style={styles.ratingLabel}>Safety</Text>
              <StarRating value={safety} onChange={setSafety} />
            </View>
            <View style={styles.ratingGroup}>
              <Text style={styles.ratingLabel}>Timeliness</Text>
              <StarRating value={timeliness} onChange={setTimeliness} />
            </View>
            <View style={styles.ratingGroup}>
              <Text style={styles.ratingLabel}>Comfort</Text>
              <StarRating value={comfort} onChange={setComfort} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Comments (optional)</Text>
              <Input className="min-h-14 rounded-xl bg-secondary/70">
                <InputField
                  placeholder="Share more details about your experience"
                  value={comment}
                  onChangeText={setComment}
                />
              </Input>
            </View>

            <View style={styles.actions}>
              <AppButton
                label="Submit rating"
                onPress={handleSubmit}
                loading={mutation.isPending}
              />
              <AppButton label="Cancel" onPress={() => router.back()} variant="secondary" />
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
  rideInfo: { ...typography.bodyStrong, color: colors.primary, marginTop: space.x2 },
  form: { gap: space.x4 },
  ratingGroup: { gap: space.x2 },
  ratingLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  inputGroup: { gap: space.x2 },
  inputLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
  errorText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  successTitle: { ...typography.h2, color: colors.success, textAlign: 'center' },
  successBody: { ...typography.body, color: colors.muted, textAlign: 'center' },
});
