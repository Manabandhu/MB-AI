import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

export type LoadingStateVariant = 'spinner' | 'skeleton';

export type LoadingStateProps = {
  variant?: LoadingStateVariant;
  count?: number;
  label?: string;
};

export function LoadingState({
  variant = 'spinner',
  count = 3,
  label = 'Loading...',
}: LoadingStateProps) {
  const colorScheme = useColorScheme();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (variant === 'skeleton') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 750,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [variant, pulseAnim]);

  if (variant === 'spinner') {
    return (
      <View style={styles.root}>
        <ActivityIndicator size="large" color={colors.primary} />
        {label ? (
          <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>{label}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.root, { gap: space.x4 }]}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.skeleton,
            colorScheme === 'dark' && styles.skeletonDark,
            { opacity: pulseAnim },
          ]}
        >
          <View
            style={[
              styles.skeletonLine,
              { width: index === 0 ? '60%' : index === 1 ? '80%' : '40%' },
            ]}
          />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x4,
    padding: space.x6,
  },
  label: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  labelDark: { color: colors.muted },
  skeleton: {
    backgroundColor: colors.skeleton,
    borderRadius: radius.control,
    height: 16,
    overflow: 'hidden',
    width: '100%',
  },
  skeletonDark: { backgroundColor: colors.skeleton },
  skeletonLine: { height: '100%' },
});
