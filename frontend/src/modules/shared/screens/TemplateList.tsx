import { color as colors, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { ListScreen, type ListSection } from '../components/ListScreen';

export type TemplateListProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  sections?: readonly ListSection[];
  loading?: boolean;
  empty?: { title: string; body: string; actionLabel: string; onAction: () => void };
  error?: { title: string; body: string; retryLabel: string; onRetry: () => void };
};

export function TemplateList({
  eyebrow,
  title,
  subtitle,
  sections,
  loading,
  empty,
  error,
}: TemplateListProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.root, colorScheme === 'dark' && styles.rootDark]}>
      <View style={styles.header}>
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
      <ListScreen sections={sections} loading={loading} empty={empty} error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.x6 },
  rootDark: {},
  header: { gap: space.x2 },
  eyebrow: {
    color: colors.teal,
    fontSize: typography.overline.fontSize,
    fontWeight: typography.overline.fontWeight,
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
  subtitle: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  subtitleDark: { color: colors.muted },
});
