import type { AppIconName } from '@/modules/shared/ui/AppIcon';

/** The five primary destinations. Route names match files in `src/app/(tabs)/`. */
export const primaryTabs = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'explore', label: 'Explore', icon: 'compass' },
  { name: 'community', label: 'Community', icon: 'community' },
  { name: 'chat', label: 'Chat', icon: 'message' },
  { name: 'profile', label: 'Profile', icon: 'user' },
] as const satisfies readonly { name: string; label: string; icon: AppIconName }[];

export type PrimaryTabName = (typeof primaryTabs)[number]['name'];
