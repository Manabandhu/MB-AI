import type { AppIconName } from '@/modules/shared/ui/AppIcon';

type Tone = 'primary' | 'teal' | 'warm' | 'danger';

/** Icon and tint per notification type (the backend's `meta`); unknown types fall back to a bell. */
export function notificationVisual(meta: string | null | undefined): {
  icon: AppIconName;
  tone: Tone;
  label: string;
} {
  const type = (meta ?? '').trim().toUpperCase();
  switch (type) {
    case 'RIDE':
      return { icon: 'car', tone: 'teal', label: 'Rides' };
    case 'ROOM':
      return { icon: 'home', tone: 'primary', label: 'Rooms' };
    case 'CHAT':
      return { icon: 'message', tone: 'primary', label: 'Chat' };
    case 'EXPENSE':
      return { icon: 'wallet', tone: 'warm', label: 'Expenses' };
    case 'JOB':
    case 'REFERRAL':
      return { icon: 'briefcase', tone: 'warm', label: type === 'JOB' ? 'Jobs' : 'Referrals' };
    case 'EVENT':
    case 'COMMUNITY':
      return { icon: 'calendar', tone: 'teal', label: 'Community' };
    case 'SAFETY':
      return { icon: 'shield', tone: 'danger', label: 'Safety' };
    case 'AI':
      return { icon: 'sparks', tone: 'primary', label: 'Assistant' };
    default:
      return { icon: 'bell', tone: 'primary', label: 'ManaBandhu' };
  }
}

export const toneBackground = {
  primary: '$primaryTint',
  teal: '$tealTint',
  warm: '$warmTint',
  danger: '$warmTint',
} as const satisfies Record<Tone, string>;

export const toneColorKey: Record<Tone, 'primary' | 'teal' | 'warm' | 'error'> = {
  primary: 'primary',
  teal: 'teal',
  warm: 'warm',
  danger: 'error',
};
