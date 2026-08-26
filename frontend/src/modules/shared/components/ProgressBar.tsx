import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
};

export function ProgressBar({ value, max = 100, label }: ProgressBarProps) {
  const colorScheme = useColorScheme();
  const progress = Math.min(Math.max(value / max, 0), 1);

  return (
    <View style={styles.root}>
      {label || colorScheme === 'dark' ? (
        <View style={styles.headerRow}>
          {label ? (
            <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>{label}</Text>
          ) : null}
          <Text style={[styles.value, colorScheme === 'dark' && styles.valueDark]}>
            {Math.round(progress * max)}/{max}
          </Text>
        </View>
      ) : null}
      <View style={[styles.track, colorScheme === 'dark' && styles.trackDark]}>
        <View
          style={[
            styles.fill,
            { width: `${progress * 100}%` },
            colorScheme === 'dark' && styles.fillDark,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.x2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: {
    color: colors.ink,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  labelDark: { color: colors.ink },
  value: {
    color: colors.muted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  valueDark: { color: colors.muted },
  track: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 8,
    overflow: 'hidden',
  },
  trackDark: { backgroundColor: colors.border },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: '100%',
  },
  fillDark: { backgroundColor: colors.primary },
});
