import type { KeyboardEvent } from 'react';
import { Platform } from 'react-native';

/**
 * Keyboard access for pressable Tamagui stacks on web. Tamagui 2 renders them as plain `<div>`s and ignores
 * `focusable` there, so they were skipped by Tab and could not be activated from the keyboard. This adds
 * `tabIndex={0}` and Enter/Space activation (like a native button). On iOS/Android it returns nothing: `focusable`
 * and the accessibility role already cover them.
 */
export function keyboardPress(onPress: (() => void) | undefined, enabled = true) {
  if (Platform.OS !== 'web' || !onPress || !enabled) return {};
  return {
    tabIndex: 0,
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget || event.repeat) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onPress();
      }
    },
  } as const;
}
