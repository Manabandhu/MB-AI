import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { getOnboardingProgress } from '@/modules/foundation/onboardingApi';

export const ONBOARDING_START: Href = '/onboarding/what-brings-you-here';

let inFlight: Promise<void> | null = null;

/**
 * The single place that decides where a member lands after signing in or up: onboarding until it is completed,
 * then Home. Concurrent callers (a screen and the route guard) share one navigation.
 */
export function routeAfterAuth(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    let destination: Href = '/home';
    try {
      const progress = await getOnboardingProgress();
      if (!progress.isCompleted) destination = ONBOARDING_START;
    } catch {
      // If progress cannot be read, Home still works and onboarding stays reachable from the profile.
    }
    router.replace(destination);
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
