import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiHealth } from '@/lib/api';

const colors = {
  background: '#faf8ff',
  ink: '#131b2e',
  muted: '#625f6e',
  primary: '#431ebe',
  primarySoft: '#e5deff',
  surface: '#ffffff',
  teal: '#00696b',
};

export default function HomeScreen() {
  const health = useQuery({ queryKey: ['api-health'], queryFn: getApiHealth });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ManaBandhu</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Your trusted community</Text>
          <Text style={styles.title}>Find help. Share skills. Feel at home.</Text>
          <Text style={styles.body}>
            A safe place to connect with people nearby, exchange everyday help, and build meaningful
            relationships.
          </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  hero: { gap: 12, marginVertical: 28 },
  eyebrow: { color: colors.teal, fontSize: 15, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 38, fontWeight: '800', lineHeight: 44 },
  body: { color: colors.muted, fontSize: 17, lineHeight: 26 },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: '#e2e8f0',
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
  statusDotOnline: { backgroundColor: '#1b873f' },
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
