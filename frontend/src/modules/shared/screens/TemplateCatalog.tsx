import { color as colors, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export type TemplateCatalogProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  metrics?: { label: string; value: string }[];
  cards?: { id: string; title: string; body: string; meta?: string; route?: string }[];
  actions?: { label: string; route?: string; onPress?: () => void }[];
};

export function TemplateCatalog({
  eyebrow,
  title,
  subtitle,
  metrics = [],
  cards = [],
  actions = [],
}: TemplateCatalogProps) {
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
      {metrics.length ? (
        <View style={styles.metrics}>
          {metrics.map((metric) => (
            <View
              key={metric.label}
              style={[styles.metric, colorScheme === 'dark' && styles.metricDark]}
            >
              <Text style={[styles.metricValue, colorScheme === 'dark' && styles.metricValueDark]}>
                {metric.value}
              </Text>
              <Text style={[styles.metricLabel, colorScheme === 'dark' && styles.metricLabelDark]}>
                {metric.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <View
              key={action.label}
              style={[styles.action, colorScheme === 'dark' && styles.actionDark]}
            >
              {action.label}
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card.id} style={[styles.card, colorScheme === 'dark' && styles.cardDark]}>
            <Text style={[styles.cardTitle, colorScheme === 'dark' && styles.cardTitleDark]}>
              {card.title}
            </Text>
            <Text style={[styles.cardBody, colorScheme === 'dark' && styles.cardBodyDark]}>
              {card.body}
            </Text>
            {card.meta ? (
              <Text style={[styles.cardMeta, colorScheme === 'dark' && styles.cardMetaDark]}>
                {card.meta}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
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
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3 },
  metric: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: 140,
    padding: 16,
  },
  metricDark: { backgroundColor: colors.surface, borderColor: colors.border },
  metricValue: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  metricValueDark: { color: colors.primary },
  metricLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 4 },
  metricLabelDark: { color: colors.muted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  action: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  actionDark: { backgroundColor: colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: 280,
    flexGrow: 1,
    gap: 8,
    minHeight: 120,
    padding: 16,
  },
  cardDark: { backgroundColor: colors.surface, borderColor: colors.border },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', lineHeight: 24 },
  cardTitleDark: { color: colors.ink },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  cardBodyDark: { color: colors.muted },
  cardMeta: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  cardMetaDark: { color: colors.primary },
});
