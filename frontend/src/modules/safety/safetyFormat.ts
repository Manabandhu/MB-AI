/** Pure safety helpers; tested by `frontend/test/safetyUtilities.test.mjs`. No React or path aliases here. */

export const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or threats' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'other', label: 'Something else' },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]['value'];
export type ReportTargetType = 'user' | 'conversation' | 'listing';

/** The stored category: what was reported and why, e.g. `user:harassment` (max 80 characters on the server). */
export function reportCategory(target: ReportTargetType, reason: ReportReason): string {
  return `${target}:${reason}`;
}

/** Readable label for a stored category such as `user:harassment`; unknown values are shown as sent. */
export function reportCategoryLabel(category: string): string {
  const [target, reason] = String(category ?? '').split(':');
  const match = REPORT_REASONS.find((r) => r.value === (reason ?? target)?.toLowerCase());
  if (!match) return category;
  const what =
    target === 'user'
      ? 'Member'
      : target === 'conversation'
        ? 'Conversation'
        : target === 'listing'
          ? 'Listing'
          : '';
  return what && reason ? `${what}: ${match.label}` : match.label;
}

export const MIN_REPORT_DESCRIPTION = 10;

/** Status label and badge tone, case-insensitively. */
export function reportStatus(status: string | null | undefined): {
  label: string;
  tone: 'warning' | 'info' | 'success' | 'neutral';
} {
  switch (String(status ?? '').toUpperCase()) {
    case 'OPEN':
      return { label: 'Open', tone: 'warning' };
    case 'IN_REVIEW':
      return { label: 'In review', tone: 'info' };
    case 'RESOLVED':
      return { label: 'Resolved', tone: 'success' };
    case 'DISMISSED':
      return { label: 'Dismissed', tone: 'neutral' };
    default:
      return { label: String(status ?? 'Unknown'), tone: 'neutral' };
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates the trusted-contact form; returns field errors (empty when valid). */
export function trustedContactErrors(input: { name: string; phone: string; email: string }): {
  name?: string;
  phone?: string;
  email?: string;
} {
  const errors: { name?: string; phone?: string; email?: string } = {};
  const phone = input.phone.trim();
  const email = input.email.trim();
  if (!input.name.trim()) errors.name = 'Enter their name.';
  if (!phone && !email) errors.phone = 'Add a phone number or an email so you can reach them.';
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (
      !/^\+?[\d\s().-]+$/.test(phone) ||
      digits.length < 7 ||
      digits.length > 15 ||
      phone.length > 20
    ) {
      errors.phone = 'Enter a valid phone number.';
    }
  }
  if (email && (!EMAIL.test(email) || email.length > 200)) errors.email = 'Enter a valid email.';
  return errors;
}

/** `tel:` link for a stored phone number (keeps a leading + and digits only). */
export function telHref(phone: string): string {
  const trimmed = phone.trim();
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${trimmed.replace(/\D/g, '')}`;
}
