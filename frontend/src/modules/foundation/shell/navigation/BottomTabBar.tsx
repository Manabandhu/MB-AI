import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
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

/** Phone navigation: five tabs pinned to the bottom edge, above the home indicator. */
export function BottomTabBar(props: BottomTabBarProps) {
  const { palette, reduceMotion } = useAppearance();
  const press = useTabPress(props);
  const labelFor = useTabLabels();
  const keyboardOpen = useAndroidKeyboardOpen();
  const active = props.state.routes[props.state.index]?.name;
  if (keyboardOpen) return null;
  return (
    <XStack
      role="tablist"
      backgroundColor="$surface"
      borderTopColor="$borderColor"
      borderTopWidth={1}
      // Closer to the native iOS tab bar: the home-indicator inset already provides breathing room.
      paddingBottom={Math.max(props.insets.bottom - INDICATOR_OVERLAP, MIN_BAR_PADDING)}
      paddingHorizontal="$x2"
      paddingTop={INDICATOR_OVERLAP}
    >
      {primaryTabs.map((tab) => {
        const selected = tab.name === active;
        const { label, count, a11yLabel } = labelFor(tab.name);
        return (
          <YStack
            aria-label={a11yLabel}
            role="tab"
            aria-selected={selected}
            alignItems="center"
            borderRadius="$card"
            cursor="pointer"
            flex={1}
            focusable
            focusVisibleStyle={{
              outlineWidth: 3,
              outlineStyle: 'solid',
              outlineColor: '$outlineColor',
            }}
            gap={2}
            hoverStyle={{ backgroundColor: '$surfaceContainerLow' }}
            justifyContent="center"
            key={tab.name}
            minHeight="$touch"
            onPress={() => press(tab.name)}
            {...keyboardPress(() => press(tab.name))}
            pressStyle={{ opacity: 0.7 }}
          >
            <YStack
              alignItems="center"
              backgroundColor={selected ? '$primaryTint' : 'transparent'}
              borderRadius="$pill"
              justifyContent="center"
              paddingHorizontal="$x4"
              paddingVertical={4}
              scale={selected && !reduceMotion ? 1.04 : 1}
              transition={reduceMotion ? null : 'quick'}
            >
              <YStack position="relative">
                <AppIcon
                  color={selected ? palette.primary : palette.muted}
                  name={tab.icon}
                  size={22}
                  strokeWidth={selected ? 2.4 : 2}
                />
                <TabBadge count={count} />
              </YStack>
            </YStack>
            <AppText
              color={selected ? '$primary' : '$colorMuted'}
              fontSize={LABEL_SIZE}
              fontWeight={selected ? '800' : '600'}
              numberOfLines={1}
            >
              {label}
            </AppText>
          </YStack>
        );
      })}
    </XStack>
  );
}
