import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { type ReactNode, useContext } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import { useAdaptiveLayout } from '@/platform/adaptive';
import { useAppearance } from '@/theme/ThemeProvider';

type ScreenProps = {
  children: ReactNode;
  /** Pull-to-refresh handler; omit for static screens. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Fixed content above the scroll area (headers). */
  header?: ReactNode;
  /**
   * Full-bleed block at the top of the scroll content that draws under the status bar / notch itself (it must pad
   * by the top inset). When set, the screen does not add its own top inset.
   */
  hero?: ReactNode;
  /** Extra bottom padding. */
  bottomInset?: number;
  /** Respect the top safe-area inset (off when a parent header already does). */
  safeTop?: boolean;
};

/**
 * Standard page frame: theme background, safe areas, centred max content width per window class, and optional
 * pull-to-refresh. Inside the tab navigator the tab bar already covers the home indicator, so only a small gap is
 * added at the bottom. Every screen should start from this instead of its own ScrollView + container styles.
 */
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  header,
  hero,
  bottomInset = 0,
  safeTop = true,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext);
  const insideTabs = tabBarHeight !== undefined;
  const { maxContentWidth, windowClass } = useAdaptiveLayout();
  const { palette } = useAppearance();
  const gutter = windowClass === 'compact' ? 16 : 24;
  const padTop = safeTop && !hero;
  return (
    <YStack backgroundColor="$background" flex={1} paddingTop={padTop ? insets.top : 0}>
      {header}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: (insideTabs ? 24 : 32 + insets.bottom) + bottomInset,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              colors={[palette.primary]}
              onRefresh={onRefresh}
              progressViewOffset={hero ? insets.top : 0}
              refreshing={refreshing}
              tintColor={hero ? '#ffffff' : palette.primary}
            />
          ) : undefined
        }
      >
        {hero}
        <YStack
          alignSelf="center"
          gap={windowClass === 'compact' ? '$x5' : '$x6'}
          maxWidth={maxContentWidth + gutter * 2}
          paddingHorizontal={gutter}
          paddingTop={hero ? 0 : 8}
          width="100%"
        >
          {children}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
