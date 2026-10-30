import type { ColorScheme, MotionPreference } from '@manabandhu/design-system';

export type ThemePreference = 'system' | 'light' | 'dark';

/** Pure resolver so it can be unit-tested without React Native. */
export function resolveColorScheme(
  preference: ThemePreference,
  system: string | null | undefined,
): ColorScheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return system === 'dark' ? 'dark' : 'light';
}

/** The OS reduced-motion flag always wins over a "full" user choice. */
export function resolveMotion(
  preference: MotionPreference,
  systemReduced: boolean,
): MotionPreference {
  if (preference === 'off') return 'off';
  if (systemReduced) return 'reduced';
  return preference;
}
