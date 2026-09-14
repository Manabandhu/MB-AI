import { space } from '@manabandhu/design-system';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/modules/shared/ui/AppIcon';

export type CatalogCard = {
  id: string;
  title: string;
  body: string;
  meta?: string;
  route?: string;
};

export type MetricCardData = {
  label: string;
  value: string;
};

export type CatalogScreenProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  metrics?: readonly MetricCardData[];
  cards?: readonly CatalogCard[];
  actions?: { label: string; route?: string; onPress?: () => void }[];
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

export function CatalogScreen({
  eyebrow,
  title,
  subtitle,
  metrics = [],
  cards = [],
  actions = [],
  children,
}: CatalogScreenProps) {
  const router = useRouter();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        {eyebrow ? (
          <View style={styles.eyebrowBadge}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {/* Metrics */}
      {metrics.length > 0 ? (
        <View style={styles.metrics}>
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

      {/* Action Buttons */}
      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => {
                if (action.onPress) action.onPress();
                else if (action.route) router.push(action.route as Href);
              }}
              style={styles.actionBtn}
            >
              <Text style={styles.actionBtnText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {children}

      {/* Card Grid */}
      {cards.length > 0 ? (
        <View style={styles.grid}>
          {cards.map((card) => {
            const cardInner = (
              <>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {card.title}
                  </Text>
                  {card.route ? (
                    <AppIcon color={C.secondary} name="chevron-right" size={16} />
                  ) : null}
                </View>
                <Text style={styles.cardBody} numberOfLines={3}>
                  {card.body}
                </Text>
                {card.meta ? (
                  <View style={styles.cardMetaWrap}>
                    <Text style={styles.cardMeta}>{card.meta}</Text>
                  </View>
                ) : null}
              </>
            );

            return card.route ? (
              <Pressable
                key={card.id}
                accessibilityRole="button"
                accessibilityLabel={card.title}
                onPress={() => router.push(card.route as Href)}
                style={styles.card}
              >
                {cardInner}
              </Pressable>
            ) : (
              <View key={card.id} style={styles.card}>
                {cardInner}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.x5,
  },
  header: {
    gap: space.x2,
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
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.x3,
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
  actionBtn: {
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: space.x5,
    paddingVertical: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.x3,
  },
  card: {
    backgroundColor: C.cardBg,
    borderColor: C.border,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: 280,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    color: C.ink,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    flex: 1,
  },
  cardBody: {
    color: C.inkMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  cardMetaWrap: {
    marginTop: 'auto',
    paddingTop: space.x2,
  },
  cardMeta: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
