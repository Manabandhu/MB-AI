import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export type ListSection = {
  title?: string;
  items: { id: string; title: string; body?: string; meta?: string }[];
};

export type ListScreenProps = {
  sections?: readonly ListSection[];
  loading?: boolean;
  empty?: { title: string; body: string; actionLabel: string; onAction: () => void };
  error?: { title: string; body: string; retryLabel: string; onRetry: () => void };
  children?: React.ReactNode;
};

export function ListScreen({
  sections = [],
  loading: _loading,
  empty,
  error,
  children,
}: ListScreenProps) {
  const colorScheme = useColorScheme();

  if (error) {
    return (
      <View style={[styles.state, colorScheme === 'dark' && styles.stateDark]}>
        <Text style={[styles.stateTitle, colorScheme === 'dark' && styles.stateTitleDark]}>
          {error.title}
        </Text>
        <Text style={[styles.stateBody, colorScheme === 'dark' && styles.stateBodyDark]}>
          {error.body}
        </Text>
        <View style={styles.stateAction}>{error.retryLabel}</View>
      </View>
    );
  }

  if (empty) {
    return (
      <View style={[styles.state, colorScheme === 'dark' && styles.stateDark]}>
        <Text style={[styles.stateTitle, colorScheme === 'dark' && styles.stateTitleDark]}>
          {empty.title}
        </Text>
        <Text style={[styles.stateBody, colorScheme === 'dark' && styles.stateBodyDark]}>
          {empty.body}
        </Text>
        <View style={styles.stateAction}>{empty.actionLabel}</View>
      </View>
    );
  }

  return (
    <View style={[styles.root, colorScheme === 'dark' && styles.rootDark]}>
      {sections.map((section, index) => (
        <View key={index} style={styles.section}>
          {section.title ? (
            <Text style={[styles.sectionTitle, colorScheme === 'dark' && styles.sectionTitleDark]}>
              {section.title}
            </Text>
          ) : null}
          <View style={styles.items}>
            {section.items.map((item) => (
              <View key={item.id} style={[styles.item, colorScheme === 'dark' && styles.itemDark]}>
                <Text style={[styles.itemTitle, colorScheme === 'dark' && styles.itemTitleDark]}>
                  {item.title}
                </Text>
                {item.body ? (
                  <Text style={[styles.itemBody, colorScheme === 'dark' && styles.itemBodyDark]}>
                    {item.body}
                  </Text>
                ) : null}
                {item.meta ? (
                  <Text style={[styles.itemMeta, colorScheme === 'dark' && styles.itemMetaDark]}>
                    {item.meta}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ))}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.x6 },
  rootDark: {},
  section: { gap: space.x3 },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    lineHeight: typography.h3.lineHeight,
  },
  sectionTitleDark: { color: colors.ink },
  items: { gap: space.x3 },
  item: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.x1,
    padding: space.x4,
  },
  itemDark: { backgroundColor: colors.surface, borderColor: colors.border },
  itemTitle: {
    color: colors.ink,
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    lineHeight: typography.h4.lineHeight,
  },
  itemTitleDark: { color: colors.ink },
  itemBody: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  itemBodyDark: { color: colors.muted },
  itemMeta: {
    color: colors.primary,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
  itemMetaDark: { color: colors.primary },
  state: { alignItems: 'center', gap: space.x3, padding: space.x6 },
  stateDark: {},
  stateTitle: {
    color: colors.ink,
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    textAlign: 'center',
  },
  stateTitleDark: { color: colors.ink },
  stateBody: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  stateBodyDark: { color: colors.muted },
  stateAction: {
    backgroundColor: colors.primary,
    borderRadius: radius.control,
    paddingHorizontal: space.x6,
    paddingVertical: space.x3,
  },
});
