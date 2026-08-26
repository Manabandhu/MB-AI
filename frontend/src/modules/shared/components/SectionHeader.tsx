import { color as colors, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.root}>
      <View style={styles.texts}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, colorScheme === 'dark' && styles.eyebrowDark]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={[styles.title, colorScheme === 'dark' && styles.titleDark]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, colorScheme === 'dark' && styles.subtitleDark]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={styles.action}
        >
          <Text style={[styles.actionText, colorScheme === 'dark' && styles.actionTextDark]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.x4,
  },
  texts: { flex: 1, gap: space.x1 },
  eyebrow: {
    color: colors.teal,
    fontSize: typography.overline.fontSize,
    fontWeight: typography.overline.fontWeight,
    letterSpacing: typography.overline.letterSpacing,
    textTransform: 'uppercase',
  },
  eyebrowDark: { color: colors.teal },
  title: {
    color: colors.ink,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    lineHeight: typography.h3.lineHeight,
  },
  titleDark: { color: colors.ink },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  subtitleDark: { color: colors.muted },
  action: { paddingVertical: space.x2 },
  actionText: {
    color: colors.primary,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  actionTextDark: { color: colors.primary },
});
