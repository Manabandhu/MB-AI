import type { ReactNode } from 'react';
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
  /** Extra bottom padding, for screens with a bottom tab bar. */
  bottomInset?: number;
  /** Respect the top safe-area inset (off when a parent header already does). */
  safeTop?: boolean;
};

/**
 * Standard page frame: theme background, safe areas, centred max content width per window class, and optional
 * pull-to-refresh. Every screen should start from this instead of its own ScrollView + container styles.
 */
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  header,
  bottomInset = 0,
  safeTop = true,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { maxContentWidth, windowClass } = useAdaptiveLayout();
  const { palette } = useAppearance();
  const gutter = windowClass === 'compact' ? 16 : 24;
  return (
    <YStack backgroundColor="$background" flex={1} paddingTop={safeTop ? insets.top : 0}>
      {header}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: gutter,
          paddingTop: 16,
          paddingBottom: 32 + bottomInset + insets.bottom,
          width: '100%',
          maxWidth: maxContentWidth + gutter * 2,
          alignSelf: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              colors={[palette.primary]}
              onRefresh={onRefresh}
              refreshing={refreshing}
              tintColor={palette.primary}
            />
          ) : undefined
        }
      >
        <YStack gap="$x6">{children}</YStack>
      </ScrollView>
    </YStack>
  );
}
