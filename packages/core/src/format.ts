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

const relativeUnits: [RelativeUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

type RelativeUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute';

/** English wording used where `Intl.RelativeTimeFormat` is missing (Hermes on iOS/Android does not ship it). */
function relativeFallback(value: number, unit: RelativeUnit): string {
  if (unit === 'day' && value === -1) return 'yesterday';
  if (unit === 'day' && value === 1) return 'tomorrow';
  const n = Math.abs(value);
  const label = `${n} ${unit}${n === 1 ? '' : 's'}`;
  return value < 0 ? `${label} ago` : `in ${label}`;
}

/** "3 hours ago", "in 2 days", or "just now" under a minute. */
export function formatRelative(value: DateInput, now: DateInput = Date.now()): string | null {
  const date = toDate(value);
  const reference = toDate(now);
  if (!date || !reference) return null;
  const seconds = Math.round((date.getTime() - reference.getTime()) / 1000);
  const RelativeTimeFormat = typeof Intl !== 'undefined' ? Intl.RelativeTimeFormat : undefined;
  const formatter =
    typeof RelativeTimeFormat === 'function'
      ? new RelativeTimeFormat(activeLocale, { numeric: 'auto' })
      : null;
  for (const [unit, size] of relativeUnits) {
    if (Math.abs(seconds) >= size) {
      const amount = Math.round(seconds / size);
      return formatter ? formatter.format(amount, unit) : relativeFallback(amount, unit);
    }
  }
  return 'just now';
}

/** 1234 → "1.2K" without relying on `notation: 'compact'`, which some JS engines (Hermes) do not support. */
function compactNumber(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const units: [number, string][] = [
    [1, ''],
    [1e3, 'K'],
    [1e6, 'M'],
    [1e9, 'B'],
    [1e12, 'T'],
  ];
  // Largest unit not above the value; if rounding reaches 1000 of it (999,999 → "1000K"), promote one unit.
  let index = 0;
  while (index < units.length - 1 && abs >= (units[index + 1]?.[0] ?? Infinity)) index += 1;
  const roundTo = (i: number) => {
    const size = units[i]?.[0] ?? 1;
    return i === 0 ? Math.round(abs) : Math.round((abs / size) * 10) / 10;
  };
  let rounded = roundTo(index);
  if (rounded >= 1000 && index < units.length - 1) {
    index += 1;
    rounded = roundTo(index);
  }
  return `${sign}${String(rounded).replace(/\.0$/, '')}${units[index]?.[1] ?? ''}`;
}

const knownSymbols: Record<string, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
};

function currencySymbol(currency: string): string {
  if (knownSymbols[currency]) return knownSymbols[currency];
  try {
    const parts = new Intl.NumberFormat(activeLocale, {
      style: 'currency',
      currency,
    }).formatToParts(0);
    return parts.find((part) => part.type === 'currency')?.value ?? `${currency} `;
  } catch {
    return `${currency} `;
  }
}

export function formatMoney(
  amount: number,
  currency = 'USD',
  options: { absolute?: boolean; compact?: boolean } = {},
): string {
  const value = options.absolute ? Math.abs(amount) : amount;
  if (options.compact) {
    // Format the symbol with a plain currency formatter and the size with our own compact rule.
    const symbol = currencySymbol(currency);
    return value < 0 ? `-${symbol}${compactNumber(-value)}` : `${symbol}${compactNumber(value)}`;
  }
  try {
    return new Intl.NumberFormat(activeLocale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
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
  return compactNumber(value);
}
