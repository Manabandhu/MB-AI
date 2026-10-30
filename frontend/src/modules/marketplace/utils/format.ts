import { formatMoney } from '@manabandhu/core';

/** "Free" for giveaways, otherwise the price in its currency with cents ($24.99, $1,200.00). */
export function formatListingPrice(price: number | string | null | undefined, currency?: string) {
  const value = Number(price ?? 0);
  if (!Number.isFinite(value)) return '';
  if (value === 0) return 'Free';
  return formatMoney(value, currency || 'USD');
}

export function formatListedDate(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
}
