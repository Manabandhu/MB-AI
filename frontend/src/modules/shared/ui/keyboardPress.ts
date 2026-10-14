import type { KeyboardEvent } from 'react';
import { Platform } from 'react-native';

/**
 * Keyboard access for pressable Tamagui stacks on web. Tamagui 2 renders them as plain `<div>`s and ignores
 * `focusable` there, so they were skipped by Tab and could not be activated from the keyboard. This adds
 * `tabIndex={0}` and Enter/Space activation (like a native button); pass `role: 'link'` for Enter-only links. On iOS/Android it returns nothing: `focusable`
 * and the accessibility role already cover them.
 */
export function keyboardPress(
  onPress: (() => void) | undefined,
  enabled = true,
  role: 'button' | 'link' = 'button',
) {
  if (Platform.OS !== 'web' || !onPress || !enabled) return {};
  return {
    tabIndex: 0,
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget || event.repeat) return;
      // Links activate on Enter only (Space scrolls the page), buttons and checkboxes on Enter or Space.
      if (event.key === 'Enter' || (event.key === ' ' && role === 'button')) {
        event.preventDefault();
        onPress();
      }
    },
  } as const;
}
