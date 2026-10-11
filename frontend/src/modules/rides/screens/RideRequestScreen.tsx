import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Screen } from '@/modules/shared/ui/Screen';
import { TextField } from '@/modules/shared/ui/TextField';

/**
 * Riders find a driver going their way and book or request a seat on that ride. (Open "ride wanted" posts are
 * not supported by the backend, so this screen searches matching offers instead of pretending to send a request.)
 */
export function RideRequestScreen() {
  const [pickupArea, setPickupArea] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    if (!pickupArea.trim() && !destination.trim()) {
      setError('Enter a pickup area, a destination, or both.');
      return;
    }
    router.push({
      pathname: '/rides/search',
      params: { from: pickupArea.trim(), to: destination.trim() },
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Screen>
        <YStack gap="$x4">
          <BackButton fallback="/rides" />
          <YStack gap="$x1">
            <AppText role="heading" variant="h2">
              Find a ride
            </AppText>
            <AppText tone="muted">
              Tell us where you are going. We show drivers heading your way, and you can book a seat
              on the ride that fits.
            </AppText>
          </YStack>
          <TextField
            label="Pickup area"
            onChangeText={setPickupArea}
            onSubmitEditing={handleSubmit}
            placeholder="Broad area, e.g. Irving"
            returnKeyType="next"
            value={pickupArea}
          />
          <TextField
            label="Destination"
            onChangeText={setDestination}
            onSubmitEditing={handleSubmit}
            placeholder="Where do you need to go?"
            returnKeyType="search"
            value={destination}
          />
          {error ? (
            <AppText aria-live="polite" tone="danger">
              {error}
            </AppText>
          ) : null}
          <XStack flexWrap="wrap" gap="$x2">
            <AppButton icon="search" label="Find matching rides" onPress={handleSubmit} />
            <AppButton label="Cancel" onPress={() => router.back()} variant="ghost" />
          </XStack>
        </YStack>
      </Screen>
    </KeyboardAvoidingView>
  );
}
