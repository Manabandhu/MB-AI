import { spring } from '@manabandhu/design-system';
import { type ReactNode, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { AppText } from '@/modules/shared/ui/AppText';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { useAppearance } from '@/theme/ThemeProvider';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** `tall` reserves most of the screen (lists with search); `auto` fits the content. */
  size?: 'auto' | 'tall';
};

/**
 * The app's bottom sheet: slides up, never extends under the notch, keeps its header visible above the keyboard,
 * only pads for the home indicator when the keyboard is hidden, and closes on backdrop tap, the close button,
 * Android back, or a downward drag on the handle.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  size = 'auto',
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { reduceMotion, palette } = useAppearance();
  const [mounted, setMounted] = useState(visible);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const offscreen = height;
  const translateY = useSharedValue(offscreen);
  const backdrop = useSharedValue(0);
  const maxHeight = height - insets.top - 12;

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardOpen(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      backdrop.value = withTiming(1, { duration: reduceMotion ? 0 : 200 });
      translateY.value = reduceMotion ? 0 : withSpring(0, spring.gentle);
    } else if (mounted) {
      Keyboard.dismiss();
      backdrop.value = withTiming(0, { duration: reduceMotion ? 0 : 180 });
      translateY.value = withTiming(offscreen, { duration: reduceMotion ? 0 : 220 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, mounted, reduceMotion, offscreen, backdrop, translateY]);

  const drag = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > 90 || event.velocityY > 900) runOnJS(onClose)();
      else translateY.value = withSpring(0, spring.snappy);
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  if (!mounted) return null;
  return (
    <Modal animationType="none" onRequestClose={onClose} statusBarTranslucent transparent visible>
      <GestureHandlerRootView style={styles.fill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: palette.overlay }, backdropStyle]}
        >
          <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.fill} />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
          style={styles.end}
        >
          <Animated.View style={[styles.sheetWidth, sheetStyle]}>
            <YStack
              backgroundColor="$surface"
              borderTopLeftRadius={28}
              borderTopRightRadius={28}
              height={size === 'tall' ? maxHeight * 0.88 : undefined}
              maxHeight={maxHeight}
              paddingBottom={keyboardOpen ? 12 : Math.max(insets.bottom, 16)}
              paddingHorizontal="$x4"
            >
              <GestureDetector gesture={drag}>
                <YStack alignItems="center" paddingBottom="$x2" paddingTop="$x2">
                  <YStack backgroundColor="$borderColor" borderRadius={3} height={5} width={40} />
                </YStack>
              </GestureDetector>
              <XStack alignItems="center" gap="$x3" paddingBottom="$x3">
                <YStack flex={1} gap={2}>
                  <AppText role="heading" variant="h4">
                    {title}
                  </AppText>
                  {subtitle ? (
                    <AppText tone="muted" variant="caption">
                      {subtitle}
                    </AppText>
                  ) : null}
                </YStack>
                <IconButton
                  icon="close"
                  label="Close"
                  onPress={onClose}
                  size={18}
                  variant="tinted"
                />
              </XStack>
              <YStack flex={size === 'tall' ? 1 : undefined} flexShrink={1}>
                {children}
              </YStack>
            </YStack>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  end: { flex: 1, justifyContent: 'flex-end' },
  // Centred and capped on tablets and desktop so the sheet does not stretch edge to edge.
  sheetWidth: { width: '100%', maxWidth: 640, alignSelf: 'center' },
});
