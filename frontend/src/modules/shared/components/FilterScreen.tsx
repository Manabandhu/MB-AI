import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export type FilterScreenProps = {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  applyLabel?: string;
  onApply?: () => void;
  resetLabel?: string;
  onReset?: () => void;
};

export function FilterScreen({
  eyebrow,
  title,
  children,
  applyLabel = 'Apply',
  onApply: _onApply,
  resetLabel = 'Reset',
  onReset: _onReset,
}: FilterScreenProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.root, colorScheme === 'dark' && styles.rootDark]}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, colorScheme === 'dark' && styles.eyebrowDark]}>
          {eyebrow}
        </Text>
      ) : null}
      <Text style={[styles.title, colorScheme === 'dark' && styles.titleDark]}>{title}</Text>
      <View style={styles.content}>{children}</View>
      <View style={styles.actions}>
        <View
          style={[styles.actionButton, styles.reset, colorScheme === 'dark' && styles.resetDark]}
        >
          <Text style={[styles.resetText, colorScheme === 'dark' && styles.resetTextDark]}>
            {resetLabel}
          </Text>
        </View>
        <View
          style={[styles.actionButton, styles.apply, colorScheme === 'dark' && styles.applyDark]}
        >
          <Text style={[styles.applyText, colorScheme === 'dark' && styles.applyTextDark]}>
            {applyLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.x6 },
  rootDark: {},
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
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    lineHeight: typography.h1.lineHeight,
  },
  titleDark: { color: colors.ink },
  content: { gap: space.x5 },
  actions: { flexDirection: 'row', gap: space.x3 },
  actionButton: {
    borderRadius: radius.control,
    flex: 1,
    paddingVertical: space.x3,
    alignItems: 'center',
  },
  reset: { backgroundColor: colors.primarySoft },
  resetDark: { backgroundColor: colors.primarySoft },
  resetText: { color: colors.primary, fontWeight: '700' },
  resetTextDark: { color: colors.primary },
  apply: { backgroundColor: colors.primary },
  applyDark: { backgroundColor: colors.primary },
  applyText: { color: colors.surface, fontWeight: '700' },
  applyTextDark: { color: colors.surface },
});
