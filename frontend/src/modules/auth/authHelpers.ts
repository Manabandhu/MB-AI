// Pure helpers shared by the auth screens. Kept free of React Native imports so they run under `node --test`.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Returns what the password still needs, or null when it is acceptable. */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    return 'Include at least one letter and one number';
  return null;
}

/** Builds an E.164 number from a dial code such as "+1" and whatever the user typed. */
export function toE164(dialCode: string, typed: string): string {
  return `${dialCode}${typed.replace(/\D/g, '')}`;
}

/** The last four digits of a phone number, for "ending in 0123" copy. */
export function phoneLastFour(e164: string): string {
  return e164.replace(/\D/g, '').slice(-4);
}

/** Maps Supabase Auth and network errors to plain language a member can act on. */
export function friendlyAuthError(error: unknown): string {
  const message = (error instanceof Error ? error.message : String(error ?? '')).toLowerCase();
  if (message.includes('invalid login credentials')) {
    return "That email and password don't match. Try again or reset your password.";
  }
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (message.includes('email not confirmed')) {
    return 'Confirm your email first. Open the link we sent you, then sign in.';
  }
  if (
    message.includes('expired') ||
    message.includes('invalid otp') ||
    message.includes('token has expired')
  ) {
    return 'That code is incorrect or has expired. Request a new one.';
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  if (message.includes('weak') || message.includes('at least 8')) {
    return `Choose a stronger password with at least ${MIN_PASSWORD_LENGTH} characters, a letter, and a number.`;
  }
  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timed out')
  ) {
    return "We can't reach ManaBandhu right now. Check your connection and try again.";
  }
  if (message.includes('provider is not enabled') || message.includes('unsupported provider')) {
    return 'This sign-in option is not available yet. Use email or phone instead.';
  }
  return 'Something went wrong. Please try again.';
}

export type AuthRedirectResult =
  | { kind: 'session'; accessToken: string; refreshToken: string }
  | { kind: 'code'; code: string }
  | { kind: 'error'; message: string }
  | { kind: 'none' };

/** Reads tokens, a PKCE code, or an error from an OAuth / magic-link redirect URL (query or fragment). */
export function parseAuthRedirect(url: string): AuthRedirectResult {
  const params = new URLSearchParams();
  const [beforeHash, hash = ''] = url.split('#');
  const query = beforeHash.includes('?') ? beforeHash.slice(beforeHash.indexOf('?') + 1) : '';
  for (const part of [query, hash]) {
    for (const [key, value] of new URLSearchParams(part)) params.set(key, value);
  }
  const error = params.get('error_description') ?? params.get('error');
  if (error) return { kind: 'error', message: error.replace(/\+/g, ' ') };
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) return { kind: 'session', accessToken, refreshToken };
  const code = params.get('code');
  if (code) return { kind: 'code', code };
  return { kind: 'none' };
}
