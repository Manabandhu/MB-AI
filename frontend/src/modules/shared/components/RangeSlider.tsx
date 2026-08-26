import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export type RangeSliderProps = {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
};

export function RangeSlider({
  label,
  min,
  max,
  step: _step = 1,
  value,
  onValueChange: _onValueChange,
  formatValue = (v) => String(v),
}: RangeSliderProps) {
  const colorScheme = useColorScheme();
  const [low, high] = value;
  const lowPercent = ((low - min) / (max - min)) * 100;
  const highPercent = ((high - min) / (max - min)) * 100;

  return (
    <View style={[styles.root, colorScheme === 'dark' && styles.rootDark]}>
      {label ? (
        <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>{label}</Text>
      ) : null}
      <View style={styles.track}>
        <View
          style={[styles.trackFill, { left: `${lowPercent}%`, right: `${100 - highPercent}%` }]}
        />
      </View>
      <View style={styles.values}>
        <Text style={[styles.value, colorScheme === 'dark' && styles.valueDark]}>
          {formatValue(low)}
        </Text>
        <Text style={[styles.value, colorScheme === 'dark' && styles.valueDark]}>
          {formatValue(high)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.x3 },
  rootDark: {},
  label: {
    color: colors.ink,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  labelDark: { color: colors.ink },
  track: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 8,
    position: 'relative',
  },
  trackFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: '100%',
    position: 'absolute',
  },
  values: { flexDirection: 'row', justifyContent: 'space-between' },
  value: {
    color: colors.muted,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  valueDark: { color: colors.muted },
});
