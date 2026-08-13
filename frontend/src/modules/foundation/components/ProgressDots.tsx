import { color as colors, space } from '@manabandhu/design-system';
import { StyleSheet, View } from 'react-native';

type ProgressDotsProps = {
  count: number;
  index: number;
};

export function ProgressDots({ count, index }: ProgressDotsProps) {
  const dots = Array.from({ length: count }, (_, dotIndex) => `welcome-progress-${dotIndex}`);

  return (
    <View accessibilityLabel={`Progress: Step ${index + 1} of ${count}`} style={styles.progress}>
      {dots.map((dotId, dotIndex) => (
        <View key={dotId} style={[styles.dot, dotIndex === index && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progress: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.x2,
    justifyContent: 'center',
  },
  dot: { backgroundColor: colors.border, borderRadius: 4, height: 8, width: 8 },
  dotActive: { backgroundColor: colors.primary, width: 32 },
});
