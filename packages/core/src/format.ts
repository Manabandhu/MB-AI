/**
 * Locale-aware formatters for every module (dates, money, salaries, counts). Pure `Intl`, no dependencies.
 * Functions return `null` for missing or invalid input so callers choose an honest fallback label.
 */

let activeLocale: string | undefined;

/** Called by the i18n layer when the user's language changes. `undefined` means the device default. */
export function setFormatLocale(locale: string | undefined) {
  activeLocale = locale;
}

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const dateStyles = {
  short: { month: 'short', day: 'numeric' },
  medium: { month: 'short', day: 'numeric', year: 'numeric' },
  long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  weekdayTime: {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
  dateTime: { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

export type DateStyle = keyof typeof dateStyles;

export function formatDate(value: DateInput, style: DateStyle = 'medium'): string | null {
  const date = toDate(value);
  return date ? date.toLocaleString(activeLocale, dateStyles[style]) : null;
}

export function formatTime(value: DateInput): string | null {
  const date = toDate(value);
  return date
    ? date.toLocaleTimeString(activeLocale, { hour: 'numeric', minute: '2-digit' })
    : null;
}

export function formatTimeRange(start: DateInput, end?: DateInput): string | null {
  const from = formatTime(start);
  if (!from) return null;
  const to = formatTime(end);
  return to ? `${from} – ${to}` : from;
}

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

/** "3 hours ago", "in 2 days", or "just now" under a minute. */
export function formatRelative(value: DateInput, now: DateInput = Date.now()): string | null {
  const date = toDate(value);
  const reference = toDate(now);
  if (!date || !reference) return null;
  const seconds = Math.round((date.getTime() - reference.getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(activeLocale, { numeric: 'auto' });
  for (const [unit, size] of relativeUnits) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

export function formatMoney(
  amount: number,
  currency = 'USD',
  options: { absolute?: boolean; compact?: boolean } = {},
): string {
  const value = options.absolute ? Math.abs(amount) : amount;
  try {
    return new Intl.NumberFormat(activeLocale, {
      style: 'currency',
      currency,
      notation: options.compact ? 'compact' : 'standard',
      maximumFractionDigits: options.compact ? 1 : 2,
      minimumFractionDigits: options.compact ? 0 : 2,
    }).format(value);
  } catch {
    // Unknown currency codes still render rather than crash.
    return `${currency} ${value.toFixed(2)}`;
  }
}

/** "$80K – $120K / yr". Returns null when neither bound is listed. */
export function formatSalaryRange(
  min?: number | null,
  max?: number | null,
  options: { currency?: string; period?: string; compact?: boolean } = {},
): string | null {
  const { currency = 'USD', period = 'yr', compact = true } = options;
  const fmt = (n: number) => formatMoney(n, currency, { compact }).replace(/\.00$/, '');
  const suffix = period ? ` / ${period}` : '';
  if (min && max) return `${fmt(min)} – ${fmt(max)}${suffix}`;
  if (min) return `From ${fmt(min)}${suffix}`;
  if (max) return `Up to ${fmt(max)}${suffix}`;
  return null;
}

/** 1234 → "1.2K". */
export function formatCount(value: number): string {
  return new Intl.NumberFormat(activeLocale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
