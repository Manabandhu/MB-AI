import { color, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type ReferralDetailContent = {
  title: string;
  body: string;
  eyebrow: string;
  meta?: string;
};

type ReferralDetailsScreenProps = {
  referralId: string;
};

export function ReferralDetailsScreen({ referralId }: ReferralDetailsScreenProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['referrals', 'detail', referralId],
    queryFn: async (): Promise<ReferralDetailContent> => {
      const response = await apiFetch(`/api/v1/referrals/${referralId}`);
      if (!response.ok) throw new Error(`Referral failed: ${response.status}`);
      return response.json() as Promise<ReferralDetailContent>;
    },
  });

  const fallback: ReferralDetailContent = {
    eyebrow: 'Referrals',
    title: 'Need a plumber',
    body: 'Looking for a reliable plumber near Irving. Two community members have offered referrals.',
    meta: 'Open · 2 offers',
  };

  const content = data ?? fallback;

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading referral...</Text>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load referral"
          body="There was a problem loading this referral."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.meta} />
      <Text style={styles.body}>{content.body}</Text>
      <View style={styles.actions}>
        <AppButton label="Back to referrals" route="/referrals" variant="secondary" />
        <AppButton label="Request referral" route="/referrals/request" />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: {
    color: color.ink,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    marginTop: space.x4,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, marginTop: space.x6 },
  loadingText: { color: color.muted, fontSize: typography.body.fontSize, padding: space.x6 },
});
