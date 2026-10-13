import { useScrollToTop } from 'expo-router';
import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { type ReactNode, type RefObject, useContext, useRef } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import { useAdaptiveLayout } from '@/platform/adaptive';
import { useAppearance } from '@/theme/ThemeProvider';

/** Bottom breathing room inside the tab navigator (the tab bar already covers the home indicator). */
const TAB_SCREEN_BOTTOM_GAP = 24;
/** Bottom breathing room on stack screens, added to the home-indicator inset. */
const SCREEN_BOTTOM_GAP = 32;
/** Width cap for single-column forms (`maxWidth="form"`), so fields stay readable on tablets and desktop. */
export const FORM_MAX_WIDTH = 640;

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
  /** Lift the content above the on-screen keyboard (forms). Uses `padding` on iOS; Android resizes itself. */
  keyboardAvoiding?: boolean;
  /** `form` caps the content at `FORM_MAX_WIDTH` (centred); `content` (default) uses the window-class width. */
  maxWidth?: 'form' | 'content';
};

/**
 * Scrolls a tab's screen back to the top when its already-active tab is pressed again (the tab bars emit
 * `tabPress`). Rendered only inside the tab navigator: `useScrollToTop` throws without a navigation route.
 */
function TabScrollToTop({ scrollRef }: { scrollRef: RefObject<ScrollView | null> }) {
  useScrollToTop(scrollRef as RefObject<ScrollView>);
  return null;
}

/**
 * Standard page frame: theme background, safe areas, centred max content width per window class, and optional
 * pull-to-refresh. Inside the tab navigator, pressing the active tab again scrolls back to the top. Inside the tab navigator the tab bar already covers the home indicator, so only a small gap is
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
  keyboardAvoiding = false,
  maxWidth = 'content',
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext);
  const insideTabs = tabBarHeight !== undefined;
  const scrollRef = useRef<ScrollView>(null);
  const { maxContentWidth, windowClass } = useAdaptiveLayout();
  const { palette } = useAppearance();
  const gutter = windowClass === 'compact' ? 16 : 24;
  // A `hero` runs edge to edge under the status bar, so it must pad itself by `insets.top` (HomeHeader does).
  const padTop = safeTop && !hero;
  const contentWidth =
    maxWidth === 'form' ? Math.min(FORM_MAX_WIDTH, maxContentWidth) : maxContentWidth;
  const frame = (
    <YStack backgroundColor="$background" flex={1} paddingTop={padTop ? insets.top : 0}>
      {header}
      {insideTabs ? <TabScrollToTop scrollRef={scrollRef} /> : null}
      <ScrollView
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom:
            (insideTabs ? TAB_SCREEN_BOTTOM_GAP : SCREEN_BOTTOM_GAP + insets.bottom) + bottomInset,
        }}
        keyboardShouldPersistTaps="handled"
        ref={scrollRef}
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
          maxWidth={contentWidth + gutter * 2}
          paddingHorizontal={gutter}
          paddingTop={hero ? 0 : 16}
          minWidth={0}
          width="100%"
        >
          {children}
        </YStack>
      </ScrollView>
    </YStack>
  );
  if (!keyboardAvoiding) return frame;
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      {frame}
    </KeyboardAvoidingView>
  );
}
