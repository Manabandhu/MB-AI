import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { TERMS_VERSION } from '@/modules/auth/legal/content';

const PENDING_KEY = 'manabandhu.pendingTermsConsent';

let pendingVersion: string | null = null;

/**
 * Remembers that the member ticked the consent box on Sign Up before leaving for Apple/Google. On the web the page
 * navigates away to the provider, so the flag is also kept in sessionStorage (this tab only).
 */
export function rememberPendingConsent() {
  pendingVersion = TERMS_VERSION;
  if (Platform.OS === 'web') {
    try {
      globalThis.sessionStorage?.setItem(PENDING_KEY, TERMS_VERSION);
    } catch {
      // Storage can be blocked; the member is then asked once on /accept-terms instead.
    }
  }
}

/** Returns and clears the remembered consent version, if any. */
export function takePendingConsent(): string | null {
  let version = pendingVersion;
  pendingVersion = null;
  if (Platform.OS === 'web') {
    try {
      version = version ?? globalThis.sessionStorage?.getItem(PENDING_KEY) ?? null;
      globalThis.sessionStorage?.removeItem(PENDING_KEY);
    } catch {
      // Ignore blocked storage.
    }
  }
  return version;
}

/** Records the accepted Terms version on the account (auth user metadata), the same record email sign-up writes. */
export async function recordTermsConsent(version = TERMS_VERSION): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { terms_version: version, terms_accepted_at: new Date().toISOString() },
  });
  if (error) throw error;
}
