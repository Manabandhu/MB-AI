import { color as colors } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiHealth } from '@/lib/api';
import { foundationQueryKeys, foundationRoutes } from '@/modules/foundation/foundationConstants';
import { useAdaptiveLayout } from '@/platform/adaptive';

export default function HomeScreen() {
  const health = useQuery({ queryKey: foundationQueryKeys.apiHealth, queryFn: getApiHealth });
  const layout = useAdaptiveLayout();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ManaBandhu</Text>
          </View>

          <View style={[styles.hero, layout.windowClass !== 'compact' && styles.heroExpanded]}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>Your trusted community</Text>
              <Text style={styles.title}>Find help. Share skills. Feel at home.</Text>
              <Text style={styles.body}>
                A safe place to connect with people nearby, exchange everyday help, and build
                meaningful relationships.
              </Text>
            </View>
            <View style={styles.surfaceSummary}>
              <Text style={styles.summaryTitle}>Built for every screen</Text>
              <Text style={styles.summaryText}>
                {layout.windowClass} · {Math.round(layout.width)}x{Math.round(layout.height)}
                {layout.isFoldableLike ? ' · foldable layout' : ''}
              </Text>
              <Text style={styles.summaryText}>
                {Platform.OS === 'web' ? 'Responsive browser experience' : 'Adaptive native app'}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View>
              <Text style={styles.cardLabel}>Backend connection</Text>
              <Text style={styles.cardValue}>
                {health.isPending
                  ? 'Checking...'
                  : health.isSuccess
                    ? `${health.data.status} · ${health.data.service}`
                    : 'Not connected'}
              </Text>
            </View>
            {health.isPending ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View style={[styles.statusDot, health.isSuccess && styles.statusDotOnline]} />
            )}
          </View>

          <Link href={foundationRoutes.splash} asChild>
            <Pressable accessibilityRole="button" style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Replay welcome flow</Text>
            </Pressable>
          </Link>
          <View style={styles.quickGrid}>
            {homeCards.map((card) => (
              <Link key={card.route} href={card.route} asChild>
                <Pressable accessibilityRole="button" style={styles.quickCard}>
                  <Text style={styles.quickTitle}>{card.title}</Text>
                  <Text style={styles.quickBody}>{card.body}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
          <Link href="/sign-in" asChild>
            <Pressable accessibilityRole="button" style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>I already have an account</Text>
            </Pressable>
          </Link>
          <Link href="/admin" style={styles.adminLink}>
            Super Admin
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const homeCards = [
  {
    title: 'Start setup',
    body: 'Set your area, interests, and privacy preferences.',
    route: '/onboarding',
  },
  {
    title: 'Explore',
    body: 'Open rooms, rides, notifications, and nearby help.',
    route: '/explore',
  },
  {
    title: 'Find rooms',
    body: 'Search, filter, save, and review room details.',
    route: '/rooms',
  },
  {
    title: 'Find rides',
    body: 'Search ride offers or post a ride for others.',
    route: '/rides',
  },
] as const;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  container: { alignSelf: 'center', width: '100%', gap: 16 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  hero: { gap: 12, marginVertical: 28 },
  heroExpanded: { flexDirection: 'row', alignItems: 'stretch', gap: 32 },
  heroCopy: { flex: 3, gap: 12, justifyContent: 'center' },
  eyebrow: { color: colors.teal, fontSize: 15, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 38, fontWeight: '800', lineHeight: 44 },
  body: { color: colors.muted, fontSize: 17, lineHeight: 26 },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 16,
  },
  cardLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  cardValue: { color: colors.ink, fontSize: 15, fontWeight: '700', marginTop: 4 },
  statusDot: { backgroundColor: '#ba1a1a', borderRadius: 6, height: 12, width: 12 },
  statusDotOnline: { backgroundColor: colors.success },
  surfaceSummary: {
    backgroundColor: colors.primarySoft,
    borderRadius: 24,
    flex: 2,
    justifyContent: 'center',
    minHeight: 180,
    padding: 24,
  },
  summaryTitle: { color: colors.primary, fontSize: 20, fontWeight: '800', marginBottom: 12 },
  summaryText: { color: colors.ink, fontSize: 14, lineHeight: 22 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  secondaryButtonText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: 220,
    flexGrow: 1,
    gap: 8,
    minHeight: 118,
    padding: 16,
  },
  quickTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  quickBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  adminLink: { alignSelf: 'center', color: colors.muted, fontSize: 13, padding: 10 },
});
