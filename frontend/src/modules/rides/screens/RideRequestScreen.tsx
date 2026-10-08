import { color as colors, space, typography } from '@manabandhu/design-system';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/modules/shared/ui/AppButton';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

/**
 * Riders find a driver going their way and request a seat on that ride. (Open "ride wanted" posts are not
 * supported by the backend, so this screen searches matching offers instead of pretending to send a request.)
 */
export function RideRequestScreen() {
  const [pickupArea, setPickupArea] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    if (!pickupArea.trim() || !destination.trim()) {
      setError('Please enter both a pickup area and a destination.');
      return;
    }
    router.push({
      pathname: '/rides/search',
      params: { from: pickupArea.trim(), to: destination.trim() },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.container}>
            <Text style={styles.eyebrow}>Rides</Text>
            <Text style={styles.title}>Find a ride</Text>
            <Text style={styles.subtitle}>
              Tell us where you are going. We will show drivers heading your way, and you can
              request a seat on the ride that fits.
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

              <View style={styles.actions}>
                <AppButton label="Find matching rides" onPress={handleSubmit} />
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
  errorText: { color: colors.error, fontSize: 13, fontWeight: '700' },
});
