import { color as colors, radius, space } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export type MapPinProps = {
  label?: string;
  color?: string;
  size?: number;
};

export function MapPin({ label, color = colors.error, size = 32 }: MapPinProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.root}>
      <View style={[styles.pin, { width: size, height: size }]}>
        <View style={[styles.pinInner, { backgroundColor: color }]} />
      </View>
      {label ? (
        <Text style={[styles.label, colorScheme === 'dark' && styles.labelDark]}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: space.x1 },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInner: {
    borderRadius: 16,
    width: '60%',
    height: '60%',
  },
  label: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: space.x2,
    paddingVertical: space.x1,
  },
  labelDark: { color: colors.ink, backgroundColor: colors.surface },
});
