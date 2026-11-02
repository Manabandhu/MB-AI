import { spring } from '@manabandhu/design-system';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { XStack, YStack } from 'tamagui';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useAppearance } from '@/theme/ThemeProvider';
import { TabBadge } from './TabBadge';
import { primaryTabs } from './tabs';
import { useTabLabels } from './useChatUnread';
import { useTabPress } from './useTabPress';

/**
 * Native iOS tab bars sit slightly into the home-indicator inset; trimming this much from the inset (and using it
 * as the top padding) matches that height. Devices without an indicator still get MIN_BAR_PADDING.
 */
const INDICATOR_OVERLAP = 6;
const MIN_BAR_PADDING = 8;
/** Inner padding of the floating pill and the gap around it. */
const PILL_PADDING = 6;
const PILL_MARGIN = 12;
/** Smallest label size that stays readable at the default font scale. */
const LABEL_SIZE = 12;

/**
 * Android resizes the window for the keyboard, which would lift the tab bar onto the keyboard. Hide the bar while
 * the keyboard is open there (iOS and web keep it under the keyboard on their own).
 */
function useAndroidKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return open;
}

/**
 * Phone navigation: a floating pill above the home indicator with five tabs. A highlight glides under the active
 * tab on a spring and the active icon pops; both are instant with reduced motion.
 */
export function BottomTabBar(props: BottomTabBarProps) {
  const { palette, reduceMotion } = useAppearance();
  const press = useTabPress(props);
  const labelFor = useTabLabels();
  const keyboardOpen = useAndroidKeyboardOpen();
  const active = props.state.routes[props.state.index]?.name;
  const activeIndex = Math.max(
    0,
    primaryTabs.findIndex((tab) => tab.name === active),
  );
  const [rowWidth, setRowWidth] = useState(0);
  const tabWidth = rowWidth / primaryTabs.length;
  const x = useSharedValue(0);
  useEffect(() => {
    const target = activeIndex * tabWidth;
    x.value = reduceMotion ? target : withSpring(target, spring.glide);
  }, [activeIndex, reduceMotion, tabWidth, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  if (keyboardOpen) return null;
  return (
    <YStack
      backgroundColor="$background"
      paddingBottom={Math.max(props.insets.bottom - INDICATOR_OVERLAP, MIN_BAR_PADDING)}
      paddingHorizontal={PILL_MARGIN}
      paddingTop={INDICATOR_OVERLAP}
    >
      <XStack
        role="tablist"
        backgroundColor="$surface"
        borderColor="$borderColor"
        borderRadius="$pill"
        borderWidth={1}
        elevation={8}
        onLayout={(event) => setRowWidth(event.nativeEvent.layout.width - PILL_PADDING * 2)}
        padding={PILL_PADDING}
        position="relative"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 8 }}
        shadowOpacity={0.14}
        shadowRadius={24}
      >
        {tabWidth > 0 ? (
          <Animated.View
            aria-hidden
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: PILL_PADDING,
                bottom: PILL_PADDING,
                left: PILL_PADDING,
                width: tabWidth,
                borderRadius: 999,
                backgroundColor: palette.primaryTint,
                borderWidth: 1,
                borderColor: palette.primarySoft,
              },
              indicator,
            ]}
          />
        ) : null}
        {primaryTabs.map((tab) => {
          const selected = tab.name === active;
          const { label, count, a11yLabel } = labelFor(tab.name);
          return (
            <YStack
              aria-label={a11yLabel}
              role="tab"
              aria-selected={selected}
              alignItems="center"
              borderRadius="$pill"
              cursor="pointer"
              flex={1}
              focusable
              focusVisibleStyle={{
                outlineWidth: 3,
                outlineStyle: 'solid',
                outlineColor: '$outlineColor',
              }}
              gap={2}
              justifyContent="center"
              key={tab.name}
              minHeight={52}
              onPress={() => press(tab.name)}
              {...keyboardPress(() => press(tab.name))}
              pressStyle={reduceMotion ? { opacity: 0.7 } : { scale: 0.9 }}
              transition={reduceMotion ? null : 'quick'}
            >
              <YStack
                position="relative"
                scale={selected && !reduceMotion ? 1.12 : 1}
                transition={reduceMotion ? null : 'bouncy'}
                y={selected && !reduceMotion ? -1 : 0}
              >
                <AppIcon
                  color={selected ? palette.primary : palette.muted}
                  name={tab.icon}
                  size={22}
                  strokeWidth={selected ? 2.5 : 2}
                />
                <TabBadge count={count} />
              </YStack>
              <AppText
                color={selected ? '$primary' : '$colorMuted'}
                fontSize={LABEL_SIZE - 1}
                fontWeight={selected ? '800' : '600'}
                numberOfLines={1}
              >
                {label}
              </AppText>
            </YStack>
          );
        })}
      </XStack>
    </YStack>
  );
}
