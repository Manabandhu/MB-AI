import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

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

  if (variant === 'spinner') {
    return (
      <View style={styles.root}>
        <View style={[styles.spinner, colorScheme === 'dark' && styles.spinnerDark]} />
        <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { gap: space.x4 }]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.skeleton, colorScheme === 'dark' && styles.skeletonDark]}>
          <View
            style={[
              styles.skeletonLine,
              { width: index === 0 ? '60%' : index === 1 ? '80%' : '40%' },
            ]}
          />
        </View>
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
  spinner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.primarySoft,
    borderTopColor: colors.primary,
  },
  spinnerDark: { borderColor: colors.primarySoft, borderTopColor: colors.primary },
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
