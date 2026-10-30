import { useAuthStore } from '@/lib/authStore';
import { unregisterThisDevice } from '@/modules/notifications/utils/push';
import { confirm, showError } from '@/modules/shared/ui/notify';

/**
 * Signs the member out from any screen: stops pushes to this device first (best effort, so a network blip never
 * blocks signing out), then ends the session. The store navigates to /welcome; failures are shown, not swallowed.
 */
export async function signOutWithFeedback(): Promise<void> {
  await unregisterThisDevice().catch(() => undefined);
  try {
    await useAuthStore.getState().signOut();
  } catch (error) {
    showError('Could not sign out', error);
  }
}

/** Asks first (in the app's confirm sheet), then signs out. Used by the Settings and Profile buttons. */
export async function confirmSignOut(): Promise<void> {
  const ok = await confirm({
    title: 'Sign out?',
    body: 'You will need to sign in again to see your messages, listings, and saved items on this device.',
    confirmLabel: 'Sign out',
  });
  if (ok) await signOutWithFeedback();
}
