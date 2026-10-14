import { normalizeSearch } from './exploreFilters.ts';
import { moduleAliases } from './moduleLabels.ts';

export type Destination = {
  id: string;
  title: string;
  route: string;
  module: string;
};

const PUBLIC_ROUTES = new Set([
  '/',
  '/welcome',
  '/sign-in',
  '/sign-up',
  '/email-login',
  '/phone-login',
  '/otp-verification',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/choose-login-method',
]);

/** Only destinations that can be opened without an item ID or an in-progress onboarding flow. */
export function navigableDestinations(
  items: readonly Destination[],
  isAdmin = false,
  isSuperAdmin = isAdmin,
) {
  return items.filter(
    (item) =>
      !PUBLIC_ROUTES.has(item.route) &&
      !item.route.includes('[') &&
      !item.route.startsWith('/onboarding') &&
      (item.module !== 'admin' || isAdmin) &&
      (item.route !== '/admin/automations' || isSuperAdmin),
  );
}

export function searchDestinations(items: readonly Destination[], query: string) {
  const normalize = normalizeSearch;
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [...items];
  return items
    .filter((item) => {
      const text = normalize(
        `${item.title} ${item.module} ${item.route.replaceAll('/', ' ')} ${moduleAliases(item.module).join(' ')}`,
      );
      return terms.every((term) => text.includes(term));
    })
    .sort(
      (a, b) =>
        Number(!normalize(a.title).startsWith(terms[0])) -
        Number(!normalize(b.title).startsWith(terms[0])),
    );
}
