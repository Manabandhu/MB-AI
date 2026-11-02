import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { hasAcceptedTerms } from '@/modules/auth/utils/authHelpers';
import { ACCEPT_TERMS, ensureTermsConsent } from '@/modules/auth/utils/postAuth';

/** Routes that must stay reachable without recorded consent (auth flow, the legal pages, the consent screen). */
const EXEMPT = [
  '/',
  '/splash',
  '/welcome',
  '/accept-terms',
  '/terms',
  '/privacy',
  '/sign-in',
  '/sign-up',
  '/phone-login',
  '/otp-verification',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/choose-login-method',
  '/email-login',
];

export function isTermsExemptPath(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/';
  return EXEMPT.includes(path);
}

/**
 * App-wide Terms gate, mounted once in the root layout. A signed-in account without `terms_version` is sent to
 * /accept-terms from any protected route (deep links, refreshes, new tabs), not only after sign-in. Consent ticked
 * on Sign Up before an OAuth redirect is recorded first, so those members are never asked twice.
 */
export function useTermsGate() {
  const pathname = usePathname();
  const status = useAuthStore((s) => s.status);
  const accepted = useAuthStore((s) => hasAcceptedTerms(s.user?.user_metadata));
  const exempt = isTermsExemptPath(pathname);

  useEffect(() => {
    if (status !== 'authenticated' || accepted || exempt) return;
    let cancelled = false;
    ensureTermsConsent()
      .then((ok) => {
        if (!ok && !cancelled) router.replace(ACCEPT_TERMS);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [status, accepted, exempt]);
}
