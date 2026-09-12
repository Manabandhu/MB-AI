import { color as colors, radius, space } from '@manabandhu/design-system';
import { StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type BottomSheetProps = {
  children: React.ReactNode;
  visible: boolean;
  onDismiss: () => void;
  snapPoints?: number[];
  initialSnapIndex?: number;
};

export function BottomSheet({
  children,
  visible,
  onDismiss,
  snapPoints = [300, 500],
  initialSnapIndex = 0,
}: BottomSheetProps) {
  const colorScheme = useColorScheme();
  const { height: screenHeight } = require('react-native').useWindowDimensions();
  const translateY = useSharedValue(screenHeight);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  translateY.value = withTiming(screenHeight - (snapPoints[initialSnapIndex] ?? snapPoints[0]), {
    duration: 220,
  });

  return (
    <View style={styles.backdrop}>
      <TouchableOpacity
        style={styles.backdropTouch}
        activeOpacity={1}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss bottom sheet"
      />
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colorScheme === 'dark' ? colors.surface : colors.surface,
          },
          animatedStyle,
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdropTouch: { flex: 1 },
  sheet: {
    borderTopLeftRadius: radius.panel,
    borderTopRightRadius: radius.panel,
    padding: space.x4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.muted,
    borderRadius: 2,
    height: 4,
    marginBottom: space.x3,
    width: 36,
  },
  content: { gap: space.x4 },
});
