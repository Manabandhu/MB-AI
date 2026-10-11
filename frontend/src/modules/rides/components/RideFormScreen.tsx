import { type ReactNode, type RefObject, useCallback, useRef } from 'react';
import { KeyboardAvoidingView, type LayoutChangeEvent, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import { FORM_MAX_WIDTH } from '@/modules/shared/ui/Screen';
import { useAdaptiveLayout } from '@/platform/adaptive';

/** Space kept above a section when scrolling to it, so its heading is not under the top edge. */
const SCROLL_MARGIN = 16;
const SCREEN_BOTTOM_GAP = 32;

/**
 * Form frame for ride forms: the same frame as the shared `Screen` with `maxWidth="form"` and
 * `keyboardAvoiding`, plus a handle to scroll to a section. The shared `Screen` does not expose its scroll view,
 * so this lives here until it does. Wrap each section in `anchor(key)` and call `scrollTo(key)` for the first
 * section with an error.
 */
export function useFormScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef(new Map<string, number>());

  const anchor = useCallback(
    (key: string) => (e: LayoutChangeEvent) => {
      offsets.current.set(key, e.nativeEvent.layout.y);
    },
    [],
  );

  const scrollTo = useCallback((key: string) => {
    const y = offsets.current.get(key);
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - SCROLL_MARGIN), animated: true });
  }, []);

  return { scrollRef, anchor, scrollTo };
}

type RideFormScreenProps = {
  children: ReactNode;
  scrollRef: RefObject<ScrollView | null>;
  /** Extra bottom padding, e.g. `ACTION_BAR_SPACE` under a sticky action bar. */
  bottomInset?: number;
};

export function RideFormScreen({ children, scrollRef, bottomInset = 0 }: RideFormScreenProps) {
  const insets = useSafeAreaInsets();
  const { maxContentWidth, windowClass } = useAdaptiveLayout();
  const gutter = windowClass === 'compact' ? 16 : 24;
  const width = Math.min(FORM_MAX_WIDTH, maxContentWidth);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <YStack backgroundColor="$background" flex={1} paddingTop={insets.top}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: SCREEN_BOTTOM_GAP + insets.bottom + bottomInset,
          }}
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
        >
          {/* Sections are direct children of this stack, so their layout y is their scroll offset. */}
          <YStack
            alignSelf="center"
            gap={windowClass === 'compact' ? '$x5' : '$x6'}
            maxWidth={width + gutter * 2}
            paddingHorizontal={gutter}
            paddingTop={8}
            width="100%"
          >
            {children}
          </YStack>
        </ScrollView>
      </YStack>
    </KeyboardAvoidingView>
  );
}
