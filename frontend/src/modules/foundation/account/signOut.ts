import { Alert } from 'react-native';
import { useAuthStore } from '@/lib/authStore';
import { unregisterThisDevice } from '@/modules/notifications/push';

/**
 * Signs the member out from any screen: stops pushes to this device first (best effort, so a network blip never
 * blocks signing out), then ends the session. The store navigates to /welcome; failures are shown, not swallowed.
 */
export async function signOutWithFeedback(): Promise<void> {
  await unregisterThisDevice().catch(() => undefined);
  try {
    await useAuthStore.getState().signOut();
  } catch (error) {
    Alert.alert('Could not sign out', error instanceof Error ? error.message : 'Please try again.');
  }
}
