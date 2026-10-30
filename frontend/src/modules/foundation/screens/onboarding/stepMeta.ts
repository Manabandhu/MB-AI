import type { AppIconName } from '@/modules/shared/ui/AppIcon';

// Step order, routes, and helpers shared by the onboarding flow hook and the step views.
export type OnboardingStepKey =
  | 'about'
  | 'goals'
  | 'reason'
  | 'what-brings-you-here'
  | 'location'
  | 'languages'
  | 'interests'
  | 'photo'
  | 'profile-photo'
  | 'profile_photo'
  | 'notifications'
  | 'trust'
  | 'trust_safety'
  | 'trust-and-safety'
  | 'complete';

export interface StepMeta {
  index: number;
  key: string;
  route: string;
  prevRoute: string;
  nextRoute: string;
}

export const STEP_METAS: Record<string, StepMeta> = {
  goals: {
    index: 1,
    key: 'goals',
    route: '/onboarding/what-brings-you-here',
    prevRoute: '/welcome',
    nextRoute: '/onboarding/location',
  },
  location: {
    index: 2,
    key: 'location',
    route: '/onboarding/location',
    prevRoute: '/onboarding/what-brings-you-here',
    nextRoute: '/onboarding/languages',
  },
  languages: {
    index: 3,
    key: 'languages',
    route: '/onboarding/languages',
    prevRoute: '/onboarding/location',
    nextRoute: '/onboarding/interests',
  },
  interests: {
    index: 4,
    key: 'interests',
    route: '/onboarding/interests',
    prevRoute: '/onboarding/languages',
    nextRoute: '/onboarding/profile-photo',
  },
  'profile-photo': {
    index: 5,
    key: 'profile-photo',
    route: '/onboarding/profile-photo',
    prevRoute: '/onboarding/interests',
    nextRoute: '/onboarding/notifications',
  },
  notifications: {
    index: 6,
    key: 'notifications',
    route: '/onboarding/notifications',
    prevRoute: '/onboarding/profile-photo',
    nextRoute: '/onboarding/trust-and-safety',
  },
  'trust-and-safety': {
    index: 7,
    key: 'trust_safety',
    route: '/onboarding/trust-and-safety',
    prevRoute: '/onboarding/notifications',
    nextRoute: '/onboarding/complete',
  },
  complete: {
    index: 8,
    key: 'complete',
    route: '/onboarding/complete',
    prevRoute: '/onboarding/trust-and-safety',
    nextRoute: '/home',
  },
};

export function normalizeStepKey(rawKey: string): string {
  if (rawKey === 'reason' || rawKey === 'what-brings-you-here') return 'goals';
  if (rawKey === 'photo' || rawKey === 'profile_photo') return 'profile-photo';
  if (rawKey === 'trust' || rawKey === 'trust_safety') return 'trust-and-safety';
  return rawKey;
}

export function resolveAppIcon(iconName?: string | null): AppIconName {
  if (!iconName) return 'star';
  const name = iconName.toLowerCase();
  if (name.includes('home') || name.includes('room')) return 'home';
  if (name.includes('car') || name.includes('ride')) return 'car';
  if (name.includes('briefcase') || name.includes('job') || name.includes('career'))
    return 'briefcase';
  if (name.includes('shop') || name.includes('market') || name.includes('bag'))
    return 'marketplace';
  if (name.includes('calendar') || name.includes('event')) return 'calendar';
  if (
    name.includes('shield') ||
    name.includes('safe') ||
    name.includes('trust') ||
    name.includes('legal')
  )
    return 'shield';
  if (name.includes('bell') || name.includes('alert') || name.includes('notice')) return 'bell';
  if (name.includes('message') || name.includes('chat')) return 'message';
  if (name.includes('search')) return 'search';
  if (name.includes('user') || name.includes('avatar')) return 'user';
  if (name.includes('globe') || name.includes('lang')) return 'globe';
  return 'star';
}

/** Onboarding alert choices mapped onto the notification settings keys the backend uses. */
export function onboardingToSettings(choices: Record<string, boolean>): Record<string, boolean> {
  const map: Record<string, string> = {
    chat_messages: 'chatMessages',
    emergency_sos: 'safetyAlerts',
    ride_matches: 'rideAlerts',
    room_openings: 'housingAlerts',
  };
  const settings: Record<string, boolean> = {};
  for (const [option, enabled] of Object.entries(choices)) {
    if (map[option]) settings[map[option]] = enabled;
  }
  return settings;
}
