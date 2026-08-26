import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
};

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: colors.success, text: colors.surface },
  error: { bg: colors.error, text: colors.surface },
  warning: { bg: colors.warning, text: colors.surface },
  info: { bg: colors.info, text: colors.surface },
  neutral: { bg: colors.primarySoft, text: colors.ink },
};

export function Badge({ label, variant = 'neutral', dot = false }: BadgeProps) {
  const colorScheme = useColorScheme();
  const _colors_ = colorScheme === 'dark' ? colors : colors;
  const palette = variantColors[variant];

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: palette.text }]} /> : null}
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: space.x2,
    paddingHorizontal: space.x3,
    paddingVertical: space.x1,
  },
  dot: { borderRadius: 999, height: 6, width: 6 },
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    letterSpacing: typography.caption.letterSpacing,
  },
});
