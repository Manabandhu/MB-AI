import { motion, spring } from '@manabandhu/design-system';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAppearance } from '@/theme/ThemeProvider';

/**
 * Web only: whether the last interaction was the keyboard, so the focus ring shows for Tab users but not after a
 * mouse click or tap (the same rule as CSS `:focus-visible`).
 */
let keyboardModality = false;
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener(
    'keydown',
    () => {
      keyboardModality = true;
    },
    true,
  );
  window.addEventListener(
    'pointerdown',
    () => {
      keyboardModality = false;
    },
    true,
  );
}

type PressableScaleProps = {
  children: ReactNode;
  onPress?: () => void;
  'aria-label': string;
  role?: 'button' | 'link' | 'tab' | 'menuitem' | 'checkbox';
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  disabled?: boolean;
  /** Scale while pressed; defaults to `motion.pressScale`, use `motion.pressScaleDeep` for big tiles. */
  scaleTo?: number;
  /** Light impact on native; `selection` for toggles, `none` to skip. */
  haptic?: 'light' | 'selection' | 'none';
  style?: StyleProp<ViewStyle>;
};

/**
 * Pressable that springs down on press-in and back on release (UI thread), with a haptic tap on native and a focus
 * ring on web. React Native Web's Pressable is focusable and activates on Enter/Space, so no `keyboardPress` is
 * needed. With reduced motion it dims instead of scaling.
 */
export function PressableScale({
  children,
  onPress,
  disabled,
  scaleTo = motion.pressScale,
  haptic = 'light',
  style,
  ...a11y
}: PressableScaleProps) {
  const { reduceMotion, palette } = useAppearance();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const pressIn = () => {
    if (reduceMotion) opacity.value = 0.7;
    else scale.value = withSpring(scaleTo, spring.press);
  };
  const pressOut = () => {
    opacity.value = 1;
    scale.value = reduceMotion ? 1 : withSpring(1, spring.press);
  };
  const press = () => {
    if (disabled) return;
    if (Platform.OS !== 'web' && haptic !== 'none') {
      const tap =
        haptic === 'selection'
          ? Haptics.selectionAsync()
          : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      tap.catch(() => undefined);
    }
    onPress?.();
  };

  return (
    <Pressable
      {...a11y}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={press}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={(state: PressableStateCallbackType & { focused?: boolean }) =>
        // RN Web adds `focused` to the state; native never sets it.
        state.focused && keyboardModality
          ? ({
              borderRadius: 16,
              outlineWidth: 3,
              outlineStyle: 'solid',
              outlineColor: palette.primary,
            } as ViewStyle)
          : null
      }
    >
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}
