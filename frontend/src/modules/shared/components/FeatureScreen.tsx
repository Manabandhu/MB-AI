import { color as colors, contentWidth, radius, space } from '@manabandhu/design-system';
import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/modules/shared/ui/AppButton';
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

const primaryNav = [
  { label: 'Home', route: '/home' },
  { label: 'Explore', route: '/explore' },
  { label: 'Search', route: '/search' },
  { label: 'Saved', route: '/saved' },
  { label: 'Profile', route: '/profile' },
] as const;

export function FeatureScreen({
  title,
  subtitle,
  eyebrow = 'ManaBandhu',
  currentRoute,
  metrics = [],
  cards = [],
  actions = [],
  children,
}: FeatureScreenProps) {
  const layout = useAdaptiveLayout();
  const maxWidth = layout.windowClass === 'compact' ? contentWidth.compact : layout.maxContentWidth;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth }]}>
          <View style={styles.navBar}>
            {primaryNav.map((item) => {
              const isActive = item.route === currentRoute;
              return (
                <Link key={item.route} href={item.route as Href} asChild>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    style={[styles.navItem, isActive && styles.navItemActive]}
                  >
                    <Text style={[styles.navText, isActive && styles.navTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>

          <View style={styles.header}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {metrics.length ? (
            <View style={[styles.metricsGrid, layout.columns > 1 && styles.metricsGridWide]}>
              {metrics.map((metric) => (
                <View key={metric.label} style={styles.metric}>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {actions.length ? (
            <View style={styles.actions}>
              {actions.map((action) => (
                <AppButton key={action.route} label={action.label} route={action.route} />
              ))}
            </View>
          ) : null}

          {children}

          {cards.length ? (
            <View style={[styles.cardGrid, layout.columns > 1 && styles.cardGridWide]}>
              {cards.map((card) =>
                card.route ? (
                  <Link key={card.id} href={card.route as Href} asChild>
                    <Pressable accessibilityRole="button" style={styles.card}>
                      <FeatureCardContent card={card} />
                    </Pressable>
                  </Link>
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
      {card.eyebrow ? <Text style={styles.cardEyebrow}>{card.eyebrow}</Text> : null}
      <Text style={styles.cardTitle}>{card.title}</Text>
      <Text style={styles.cardBody}>{card.body}</Text>
      {card.meta ? <Text style={styles.cardMeta}>{card.meta}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x6, width: '100%' },
  navBar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.x1,
    padding: space.x1,
  },
  navItem: {
    borderRadius: radius.pill,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: space.x3,
  },
  navItemActive: { backgroundColor: colors.primarySoft },
  navText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  navTextActive: { color: colors.primary },
  header: { gap: space.x3, paddingTop: space.x6 },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 32, fontWeight: '800', lineHeight: 38 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 25, maxWidth: 640 },
  metricsGrid: { gap: space.x3 },
  metricsGridWide: { flexDirection: 'row' },
  metric: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    flex: 1,
    padding: space.x4,
  },
  metricValue: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  metricLabel: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: space.x1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3 },
  cardGrid: { gap: space.x3 },
  cardGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    flexBasis: 320,
    flexGrow: 1,
    gap: space.x2,
    minHeight: 132,
    padding: space.x4,
  },
  cardEyebrow: { color: colors.teal, fontSize: 12, fontWeight: '800' },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', lineHeight: 24 },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  cardMeta: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 'auto' },
});
