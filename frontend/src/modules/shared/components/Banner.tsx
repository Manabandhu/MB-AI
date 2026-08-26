import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export type BannerVariant = 'info' | 'warning' | 'error' | 'success';

export type BannerProps = {
  title: string;
  body?: string;
  variant?: BannerVariant;
  onDismiss?: () => void;
  icon?: React.ReactNode;
};

export function Banner({ title, body, variant = 'info', onDismiss, icon }: BannerProps) {
  const colorScheme = useColorScheme();

  const variantStyles: Record<BannerVariant, { bg: string; border: string; text: string }> = {
    info: { bg: colors.info, border: colors.info, text: colors.surface },
    warning: { bg: colors.warning, border: colors.warning, text: colors.surface },
    error: { bg: colors.error, border: colors.error, text: colors.surface },
    success: { bg: colors.success, border: colors.success, text: colors.surface },
  };

  const palette = variantStyles[variant];

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: palette.bg, borderColor: palette.border },
        colorScheme === 'dark' && styles.rootDark,
      ]}
    >
      <View style={styles.icon}>{icon}</View>
      <View style={styles.texts}>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        {body ? <Text style={[styles.body, { color: palette.text }]}>{body}</Text> : null}
      </View>
      {onDismiss ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={onDismiss}
          style={styles.dismiss}
        >
          <Text style={[styles.dismissText, { color: palette.text }]}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x3,
    padding: space.x4,
  },
  rootDark: { opacity: 0.95 },
  icon: { marginTop: space.x1 },
  texts: { flex: 1, gap: space.x1 },
  title: {
    fontSize: typography.bodyStrong.fontSize,
    fontWeight: typography.bodyStrong.fontWeight,
    lineHeight: typography.bodyStrong.lineHeight,
  },
  body: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
    opacity: 0.95,
  },
  dismiss: { padding: space.x1 },
  dismissText: { fontSize: 18, fontWeight: '600' },
});
