import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { useAdaptiveLayout } from '@/platform/adaptive';

/**
 * Bottom space a screen reserves so its last content is not hidden behind a one-row `ActionBar`:
 * `<Screen bottomInset={ACTION_BAR_SPACE}>`. Add more when the bar's content wraps to two rows.
 */
export const ACTION_BAR_SPACE = 144;
/** Minimum padding under the bar on devices without a home indicator. */
const MIN_BOTTOM_PADDING = 12;

type ActionBarProps = {
  /** The bar's buttons, right-aligned after `leading`. */
  children: ReactNode;
  /** Context on the left, usually the price and a status line. */
  leading?: ReactNode;
  /** Names the toolbar for screen readers. */
  label?: string;
};

/**
 * Sticky bar for a detail page's primary actions. Render it after `Screen`, inside a `flex: 1` parent. It sits on
 * the surface colour with a top border, pads for the home indicator, and centres its content at the window's
 * content width.
 */
export function ActionBar({ children, leading, label = 'Actions' }: ActionBarProps) {
  const insets = useSafeAreaInsets();
  const { maxContentWidth, windowClass } = useAdaptiveLayout();
  const gutter = windowClass === 'compact' ? 16 : 24;
  return (
    <YStack
      backgroundColor="$surface"
      borderColor="$borderColor"
      borderTopWidth={1}
      bottom={0}
      left={0}
      paddingBottom={Math.max(insets.bottom, MIN_BOTTOM_PADDING)}
      paddingHorizontal={gutter}
      paddingTop="$x3"
      position="absolute"
      right={0}
      zIndex="$sticky"
    >
      <XStack
        alignItems="center"
        alignSelf="center"
        aria-label={label}
        flexWrap="wrap"
        gap="$x3"
        maxWidth={maxContentWidth}
        role="toolbar"
        width="100%"
      >
        {leading ? (
          <YStack flex={1} minWidth={120}>
            {leading}
          </YStack>
        ) : null}
        {children}
      </XStack>
    </YStack>
  );
}
