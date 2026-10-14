import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { hasAcceptedTerms } from '@/modules/auth/authHelpers';
import { recordTermsConsent, takePendingConsent } from '@/modules/auth/consent';
import { getOnboardingProgress } from '@/modules/foundation/onboardingApi';

export const ONBOARDING_START: Href = '/onboarding/what-brings-you-here';
export const ACCEPT_TERMS = '/accept-terms' as Href;

let inFlight: Promise<void> | null = null;

/**
 * Makes sure the signed-in account has a recorded Terms acceptance. Apple/Google and phone sign-in can create an
 * account without passing through Sign Up, so a missing record is filled from the consent ticked on Sign Up
 * before the OAuth redirect, or else the member is asked on /accept-terms. Returns false when they must be asked.
 * Any remembered consent is consumed whenever a session exists, so it never applies to a later account.
 */
export async function ensureTermsConsent(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return true;
  const pending = takePendingConsent();
  if (hasAcceptedTerms(data.session.user.user_metadata)) return true;
  if (!pending) return false;
  try {
    await recordTermsConsent(pending);
    return true;
  } catch {
    return false;
  }
}

/**
 * The single place that decides where a member lands after signing in or up: the Terms (once, when the account
 * has no recorded consent), then onboarding until it is completed, then Home. Concurrent callers (a screen and the
 * route guard) share one navigation.
 */
export function routeAfterAuth(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    let destination: Href = '/home';
    try {
      if (!(await ensureTermsConsent())) {
        router.replace(ACCEPT_TERMS);
        return;
      }
    } catch {
      // A failed session read is handled by the auth guards; carry on to onboarding/Home.
    }
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
