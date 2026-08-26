import { color as colors, space, typography } from '@manabandhu/design-system';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { ListScreen } from '../components/ListScreen';
import { TabBar } from '../components/TabBar';

export type TemplateAdminProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  metrics?: { label: string; value: string }[];
  sections?: {
    title?: string;
    items: { id: string; title: string; body?: string; meta?: string }[];
  }[];
  tabs?: { label: string; route?: string }[];
  activeTab?: string;
  loading?: boolean;
  empty?: { title: string; body: string; actionLabel: string; onAction: () => void };
  error?: { title: string; body: string; retryLabel: string; onRetry: () => void };
};

export function TemplateAdmin({
  eyebrow,
  title,
  subtitle,
  metrics,
  sections,
  tabs,
  activeTab,
  loading,
  empty,
  error,
}: TemplateAdminProps) {
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

      {tabs?.length ? <TabBar tabs={tabs} activeRoute={activeTab} /> : null}

      {error ? (
        <View style={styles.state}>
          <Text style={[styles.stateTitle, colorScheme === 'dark' && styles.stateTitleDark]}>
            {error.title}
          </Text>
          <Text style={[styles.stateBody, colorScheme === 'dark' && styles.stateBodyDark]}>
            {error.body}
          </Text>
          <View style={styles.stateAction}>{error.retryLabel}</View>
        </View>
      ) : null}

      {metrics?.length ? (
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
  state: { alignItems: 'center', gap: 12, padding: 24 },
  stateTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  stateTitleDark: { color: colors.ink },
  stateBody: { color: colors.muted, fontSize: 16, textAlign: 'center' },
  stateBodyDark: { color: colors.muted },
  stateAction: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});
