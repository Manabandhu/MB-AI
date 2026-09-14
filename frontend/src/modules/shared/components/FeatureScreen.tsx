import { contentWidth, space } from '@manabandhu/design-system';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { useAdaptiveLayout } from '@/platform/adaptive';

export type FeatureAction = {
  label: string;
  route: string;
};

export type FeatureMetric = {
  label: string;
  value: string;
};

export type FeatureCard = {
  id: string;
  title: string;
  eyebrow?: string;
  body: string;
  meta?: string;
  route?: string;
};

type FeatureScreenProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  currentRoute?: string;
  metrics?: readonly FeatureMetric[];
  cards?: readonly FeatureCard[];
  actions?: readonly FeatureAction[];
  children?: React.ReactNode;
};

const C = {
  primary: '#E05638', // Warm Saffron
  secondary: '#0D5C75', // Deep Gulf Teal
  bg: '#FFFDF9', // Soft warm ivory
  cardBg: '#FFFFFF',
  border: '#E8DEC8',
  ink: '#151D21',
  inkMuted: '#6B7280',
  tealBg: '#E0F2FE',
  saffronBg: '#FEE2E2',
};

export function FeatureScreen({
  title,
  subtitle,
  eyebrow = 'ManaBandhu',
  metrics = [],
  cards = [],
  actions = [],
  children,
}: FeatureScreenProps) {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const isDesktop = layout.windowClass !== 'compact';
  const maxWidth = isDesktop ? layout.maxContentWidth : contentWidth.compact;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={[styles.container, { maxWidth }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.eyebrowBadge}>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* Metrics */}
          {metrics.length > 0 ? (
            <View style={[styles.metricsGrid, isDesktop && styles.metricsGridWide]}>
              {metrics.map((metric, idx) => (
                <View key={metric.label} style={[styles.metric, idx === 0 && styles.metricPrimary]}>
                  <Text style={[styles.metricValue, idx === 0 && styles.metricValuePrimary]}>
                    {metric.value}
                  </Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Quick Actions */}
          {actions.length > 0 ? (
            <View style={styles.actions}>
              {actions.map((action) => (
                <AppButton
                  key={action.route}
                  label={action.label}
                  route={action.route}
                  variant="primary"
                />
              ))}
            </View>
          ) : null}

          {children}

          {/* Cards Grid */}
          {cards.length > 0 ? (
            <View style={[styles.cardGrid, isDesktop && styles.cardGridWide]}>
              {cards.map((card) =>
                card.route ? (
                  <Pressable
                    key={card.id}
                    accessibilityRole="button"
                    accessibilityLabel={card.title}
                    onPress={() => router.push(card.route as Href)}
                    style={styles.card}
                  >
                    <FeatureCardContent card={card} />
                  </Pressable>
                ) : (
                  <View key={card.id} style={styles.card}>
                    <FeatureCardContent card={card} />
                  </View>
                ),
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCardContent({ card }: { card: FeatureCard }) {
  return (
    <>
      <View style={styles.cardTop}>
        {card.eyebrow ? (
          <View style={styles.cardEyebrowBadge}>
            <Text style={styles.cardEyebrow}>{card.eyebrow}</Text>
          </View>
        ) : null}
        {card.route ? <AppIcon color={C.secondary} name="chevron-right" size={16} /> : null}
      </View>
      <Text style={styles.cardTitle}>{card.title}</Text>
      <Text style={styles.cardBody} numberOfLines={3}>
        {card.body}
      </Text>
      {card.meta ? (
        <View style={styles.metaRow}>
          <Text style={styles.cardMeta}>{card.meta}</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  page: {
    backgroundColor: C.bg,
    flexGrow: 1,
    paddingHorizontal: space.x4,
    paddingTop: space.x4,
    paddingBottom: space.x12,
  },
  container: {
    alignSelf: 'center',
    gap: space.x5,
    width: '100%',
  },
  header: {
    gap: space.x2,
    paddingTop: space.x2,
  },
  eyebrowBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.tealBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  eyebrow: {
    color: C.secondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: C.ink,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: C.inkMuted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 640,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.x3,
  },
  metricsGridWide: {
    flexDirection: 'row',
  },
  metric: {
    backgroundColor: C.cardBg,
    borderColor: C.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: 130,
    padding: space.x4,
    shadowColor: '#2B3338',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  metricPrimary: {
    borderColor: 'rgba(224, 86, 56, 0.2)',
    backgroundColor: '#FFF8F6',
  },
  metricValue: {
    color: C.secondary,
    fontSize: 22,
    fontWeight: '800',
  },
  metricValuePrimary: {
    color: C.primary,
  },
  metricLabel: {
    color: C.inkMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: space.x1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.x3,
  },
  cardGrid: {
    gap: space.x3,
  },
  cardGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: C.cardBg,
    borderColor: C.border,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: 300,
    flexGrow: 1,
    gap: space.x2,
    minHeight: 120,
    padding: space.x4,
    shadowColor: '#2B3338',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardEyebrowBadge: {
    backgroundColor: C.tealBg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cardEyebrow: {
    color: C.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    color: C.ink,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  cardBody: {
    color: C.inkMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  metaRow: {
    marginTop: 'auto',
    paddingTop: space.x2,
  },
  cardMeta: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
