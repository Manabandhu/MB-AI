import { color as colors, space, typography } from '@manabandhu/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createRideOffer } from '@/modules/rides/api';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

export function RideOfferScreen() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [pickupArea, setPickupArea] = useState('');
  const [destination, setDestination] = useState('');
  const [departureAt, setDepartureAt] = useState('');
  const [seats, setSeats] = useState('');
  const [contribution, setContribution] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: createRideOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] });
      setSuccess(true);
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit() {
    setError(null);
    if (!title.trim() || !pickupArea.trim() || !destination.trim() || !departureAt.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    const seatsNum = parseInt(seats, 10) || 1;
    const contributionNum = contribution ? parseFloat(contribution) : undefined;
    mutation.mutate({
      title: title.trim(),
      pickupArea: pickupArea.trim(),
      destination: destination.trim(),
      departureAt: departureAt.trim(),
      seatsTotal: seatsNum,
      contribution: contributionNum,
    });
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.successTitle}>Ride offered</Text>
          <Text style={styles.successBody}>Your ride is now visible to community members.</Text>
          <AppButton label="View my rides" onPress={() => router.replace('/rides/mine')} />
          <AppButton
            label="Offer another ride"
            onPress={() => router.replace('/rides/offer')}
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.container}>
            <Text style={styles.eyebrow}>Rides</Text>
            <Text style={styles.title}>Offer a ride</Text>
            <Text style={styles.subtitle}>
              Post a ride with route, time, seats, contribution, and safe contact expectations.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Trip title</Text>
                <Input className="min-h-14 rounded-xl bg-secondary/70">
                  <InputField
                    placeholder="e.g. DFW Airport ride"
                    value={title}
                    onChangeText={setTitle}
                  />
                </Input>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pickup area</Text>
                <Input className="min-h-14 rounded-xl bg-secondary/70">
                  <InputField
                    placeholder="Broad area (e.g. Plano)"
                    value={pickupArea}
                    onChangeText={setPickupArea}
                  />
                </Input>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Destination</Text>
                <Input className="min-h-14 rounded-xl bg-secondary/70">
                  <InputField
                    placeholder="Where are you going?"
                    value={destination}
                    onChangeText={setDestination}
                  />
                </Input>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Departure date & time</Text>
                <Input className="min-h-14 rounded-xl bg-secondary/70">
                  <InputField
                    placeholder="e.g. 2026-09-15 08:30"
                    value={departureAt}
                    onChangeText={setDepartureAt}
                  />
                </Input>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.inputLabel}>Seats available</Text>
                  <Input className="min-h-14 rounded-xl bg-secondary/70">
                    <InputField
                      placeholder="2"
                      keyboardType="number-pad"
                      value={seats}
                      onChangeText={setSeats}
                    />
                  </Input>
                </View>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.inputLabel}>Contribution ($)</Text>
                  <Input className="min-h-14 rounded-xl bg-secondary/70">
                    <InputField
                      placeholder="Optional"
                      keyboardType="decimal-pad"
                      value={contribution}
                      onChangeText={setContribution}
                    />
                  </Input>
                </View>
              </View>

              <View style={styles.actions}>
                <AppButton
                  label="Publish ride"
                  onPress={handleSubmit}
                  loading={mutation.isPending}
                />
                <AppButton label="Cancel" onPress={() => router.back()} variant="secondary" />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x5, maxWidth: 640, width: '100%' },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  title: { ...typography.h1, color: colors.ink },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: space.x4 },
  form: { gap: space.x4 },
  inputGroup: { gap: space.x2 },
  inputLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row', gap: space.x3 },
  flex1: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
  errorText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  successTitle: { ...typography.h2, color: colors.success, textAlign: 'center' },
  successBody: { ...typography.body, color: colors.muted, textAlign: 'center' },
});
