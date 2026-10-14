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

/**
 * iOS/Safari password-manager rules matching `passwordProblem` (length, a letter, a digit). Sign-up and reset both
 * use this so the suggested password always passes our own validator.
 */
export const PASSWORD_RULES = `minlength: ${MIN_PASSWORD_LENGTH}; required: lower, upper; required: digit; allowed: ascii-printable;`;

/** Length of the one-time codes Supabase Auth sends (`otp_length` in supabase/config.toml). */
export const OTP_CODE_LENGTH = 6;

/** Builds an E.164 number from a dial code such as "+1" and whatever the user typed. */
export function toE164(dialCode: string, typed: string): string {
  return `${dialCode}${typed.replace(/\D/g, '')}`;
}

export type PhoneParse = { ok: true; e164: string } | { ok: false; error: string };

/** National number lengths (without the country code or trunk 0) for the dial codes we offer. */
const NATIONAL_LENGTH: Record<string, readonly [min: number, max: number]> = {
  '1': [10, 10],
  '91': [10, 10],
  '44': [9, 10],
  '61': [9, 9],
  '971': [8, 9],
  '65': [8, 8],
  '49': [6, 11],
  '353': [7, 9],
};

/** E.164 allows at most 15 digits including the country code. */
const E164_MAX_DIGITS = 15;

/**
 * Drops a country code typed without "+" ("91 98765 43210" with +91 selected): when the digits start with the
 * dial code and are longer than that country's national numbers. Unknown codes use the E.164 maximum instead.
 */
function stripTypedCountryCode(code: string, digits: string): string {
  if (!digits.startsWith(code)) return digits;
  const rest = digits.slice(code.length);
  const range = NATIONAL_LENGTH[code];
  if (range) return digits.length > range[1] && rest.length >= range[0] ? rest : digits;
  return digits.length + code.length > E164_MAX_DIGITS ? rest : digits;
}

/**
 * Turns what the member typed or pasted into an E.164 number. A leading "+" or "00" means the number already has
 * its country code ("+1 469 555 0123" stays +14695550123 whatever country is selected). Otherwise the selected
 * dial code is added, after dropping the same code typed without "+" ("91 98765 43210") and a domestic trunk "0"
 * (UK "07…").
 */
export function parsePhoneInput(dialCode: string, typed: string): PhoneParse {
  const trimmed = typed.trim();
  const digits = trimmed.replace(/\D/g, '');
  let e164: string;
  if (trimmed.startsWith('+')) {
    e164 = `+${digits}`;
  } else if (digits.startsWith('00')) {
    e164 = `+${digits.slice(2)}`;
  } else {
    const code = dialCode.replace(/\D/g, '');
    let national = stripTypedCountryCode(code, digits);
    if (code !== '1' && national.startsWith('0')) national = national.slice(1);
    if (national.length < 7 || national.length > 12) {
      return { ok: false, error: 'Enter your mobile number, or start with + and the country code' };
    }
    e164 = toE164(dialCode, national);
  }
  const total = e164.length - 1;
  if (total < 8 || total > E164_MAX_DIGITS) {
    return { ok: false, error: 'Enter a full number with its country code, like +1 469 555 0123' };
  }
  return { ok: true, e164 };
}

/** True when the account has a recorded acceptance of the Terms (`terms_version` in auth user metadata). */
export function hasAcceptedTerms(metadata: Record<string, unknown> | null | undefined): boolean {
  const version = metadata?.terms_version;
  return typeof version === 'string' && version.length > 0;
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
