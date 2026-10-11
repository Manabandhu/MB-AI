import { formatMoney } from '@manabandhu/core';

/** "$850" (cents only when the amount has them). */
export function formatAmount(amount: number): string {
  return formatMoney(amount, 'USD').replace(/\.00$/, '');
}

/** "$850/mo". */
export function formatRent(amount: number): string {
  return `${formatAmount(amount)}/mo`;
}
