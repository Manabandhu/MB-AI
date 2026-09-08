import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getReferralDetail } from '@/modules/referrals/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';

export function ReferralDetailsScreen() {
  const { referralId } = useLocalSearchParams<{ referralId: string }>();
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['referrals', 'detail', referralId],
    queryFn: () => getReferralDetail(referralId),
    enabled: Boolean(referralId),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load referral"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>Referral</Text>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>{data.description}</Text>
          <Text style={styles.meta}>
            Type: {data.type} · Status: {data.status}
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Details</Text>
            {data.category ? <DetailRow label="Category" value={data.category} /> : null}
            {data.contactInfo ? <DetailRow label="Contact" value={data.contactInfo} /> : null}
          </View>

          <View style={styles.actions}>
            <AppButton label="Back" onPress={() => router.back()} variant="secondary" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x5, maxWidth: 640, width: '100%' },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  title: { ...typography.h1, color: colors.ink },
  subtitle: { ...typography.body, color: colors.muted, marginTop: space.x2 },
  meta: { ...typography.caption, color: colors.primary, marginTop: space.x2 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.x2,
    padding: space.x4,
  },
  cardTitle: { ...typography.h4, color: colors.ink },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space.x1,
  },
  detailLabel: { ...typography.body, color: colors.muted },
  detailValue: { ...typography.bodyStrong, color: colors.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
});
