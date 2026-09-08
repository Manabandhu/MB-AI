import { color as colors, space, typography } from '@manabandhu/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createRideRequest } from '@/modules/rides/api';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

export function RideRequestScreen() {
  const queryClient = useQueryClient();
  const [pickupArea, setPickupArea] = useState('');
  const [destination, setDestination] = useState('');
  const [departureAt, setDepartureAt] = useState('');
  const [seats, setSeats] = useState('1');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: createRideRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides', 'my-requests'] });
      setSuccess(true);
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit() {
    setError(null);
    if (!pickupArea.trim() || !destination.trim() || !departureAt.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    mutation.mutate({
      rideId: 'search',
      pickupArea: pickupArea.trim(),
      destination: destination.trim(),
      departureAt: departureAt.trim(),
      seatsRequested: parseInt(seats, 10) || 1,
      message: message.trim() || undefined,
    });
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.successTitle}>Request sent</Text>
          <Text style={styles.successBody}>Drivers will see your request and can respond.</Text>
          <AppButton label="Search rides" onPress={() => router.replace('/rides/search')} />
          <AppButton
            label="Request another"
            onPress={() => router.replace('/rides/request')}
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
            <Text style={styles.title}>Request a ride</Text>
            <Text style={styles.subtitle}>
              Request a ride by describing your route, timing, and seat needs.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pickup area</Text>
                <Input className="min-h-14 rounded-xl bg-secondary/70">
                  <InputField
                    placeholder="Broad area (e.g. Irving)"
                    value={pickupArea}
                    onChangeText={setPickupArea}
                  />
                </Input>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Destination</Text>
                <Input className="min-h-14 rounded-xl bg-secondary/70">
                  <InputField
                    placeholder="Where do you need to go?"
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
                  <Text style={styles.inputLabel}>Seats needed</Text>
                  <Input className="min-h-14 rounded-xl bg-secondary/70">
                    <InputField
                      placeholder="1"
                      keyboardType="number-pad"
                      value={seats}
                      onChangeText={setSeats}
                    />
                  </Input>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message (optional)</Text>
                <Input className="min-h-14 rounded-xl bg-secondary/70">
                  <InputField
                    placeholder="Introduce yourself and any special needs"
                    value={message}
                    onChangeText={setMessage}
                  />
                </Input>
              </View>

              <View style={styles.actions}>
                <AppButton
                  label="Send request"
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
