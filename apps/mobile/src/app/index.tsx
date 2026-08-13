import { color as colors } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
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
import { useAdaptiveLayout } from '@/platform/adaptive';

export default function HomeScreen() {
  const health = useQuery({ queryKey: ['api-health'], queryFn: getApiHealth });
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
                {layout.windowClass} · {Math.round(layout.width)}×{Math.round(layout.height)}
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
                  ? 'Checking…'
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

          <Pressable accessibilityRole="button" style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Get started</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
});
