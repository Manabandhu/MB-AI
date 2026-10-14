import { type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import { useAdaptiveLayout } from '@/platform/adaptive';

/** Distance from the bottom (pt) within which new content keeps the list pinned to the newest message. */
const STICK_TO_BOTTOM = 80;

type ChatFrameProps = {
  header: ReactNode;
  /** Optional notices between the header and the messages. */
  notices?: ReactNode;
  children: ReactNode;
  composer: ReactNode;
  scrollRef: RefObject<ScrollView | null>;
};

/**
 * Full-height chat layout: a fixed header, a message list that opens at (and follows) the newest message while the
 * reader is at the bottom, and a composer that rises with the keyboard on iOS and Android. `KeyboardAvoidingView`
 * measures the real overlap, so it adds nothing when Android already resized the window.
 */
export function ChatFrame({ header, notices, children, composer, scrollRef }: ChatFrameProps) {
  const insets = useSafeAreaInsets();
  const { maxContentWidth, windowClass } = useAdaptiveLayout();
  const gutter = windowClass === 'compact' ? 16 : 24;
  const atBottom = useRef(true);
  const keyboardOpen = useKeyboardOpen();
  const firstLayout = useRef(true);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    atBottom.current =
      contentSize.height - (contentOffset.y + layoutMeasurement.height) < STICK_TO_BOTTOM;
  }, []);

  const onContentSizeChange = useCallback(() => {
    if (!atBottom.current) return;
    scrollRef.current?.scrollToEnd({ animated: !firstLayout.current });
    firstLayout.current = false;
  }, [scrollRef]);

  const column = {
    alignSelf: 'center' as const,
    maxWidth: maxContentWidth + gutter * 2,
    paddingHorizontal: gutter,
    width: '100%' as const,
  };

  return (
    <YStack backgroundColor="$background" flex={1} paddingTop={insets.top}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <YStack
          {...column}
          borderBottomWidth={1}
          borderColor="$borderColor"
          paddingBottom="$x2"
          paddingTop="$x2"
        >
          {header}
        </YStack>
        {notices ? (
          <YStack {...column} paddingTop="$x2">
            {notices}
          </YStack>
        ) : null}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 16 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={onContentSizeChange}
          onScroll={onScroll}
          ref={scrollRef}
          scrollEventThrottle={64}
        >
          <YStack {...column} flexGrow={1} gap="$x3" justifyContent="flex-end">
            {children}
          </YStack>
        </ScrollView>
        <YStack
          backgroundColor="$surface"
          borderColor="$borderColor"
          borderTopWidth={1}
          // The keyboard covers the home indicator, so its inset would only add a gap above the keyboard.
          paddingBottom={keyboardOpen ? 12 : Math.max(insets.bottom, 12)}
          paddingTop="$x2"
        >
          <YStack {...column}>{composer}</YStack>
        </YStack>
      </KeyboardAvoidingView>
    </YStack>
  );
}

/** True while the on-screen keyboard is shown (iOS fires `will*`, Android only `did*`). */
function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const subs = [
      Keyboard.addListener('keyboardWillShow', () => setOpen(true)),
      Keyboard.addListener('keyboardDidShow', () => setOpen(true)),
      Keyboard.addListener('keyboardWillHide', () => setOpen(false)),
      Keyboard.addListener('keyboardDidHide', () => setOpen(false)),
    ];
    return () => {
      for (const sub of subs) sub.remove();
    };
  }, []);
  return open;
}

/** Scrolls a chat list to its newest message (after sending). */
export function scrollToNewest(ref: RefObject<ScrollView | null>) {
  setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 50);
}
