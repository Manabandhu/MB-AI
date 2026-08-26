import { color, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type MyReferral = {
  id: string;
  title: string;
  body: string;
  meta?: string;
  route?: string;
};

type MyReferralsContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  referrals: MyReferral[];
};

export function MyReferralsScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['referrals', 'mine'],
    queryFn: async (): Promise<MyReferralsContent> => {
      const response = await apiFetch('/api/v1/referrals/mine');
      if (!response.ok) throw new Error(`My referrals failed: ${response.status}`);
      return response.json() as Promise<MyReferralsContent>;
    },
  });

  const fallback: MyReferralsContent = {
    eyebrow: 'Referrals',
    title: 'My referrals',
    subtitle: 'Your requested and offered referrals.',
    referrals: [
      {
        id: '1',
        title: 'Need a plumber',
        body: 'Requested · awaiting responses',
        route: '/referrals/1',
      },
      { id: '2', title: 'Offering tutoring', body: 'Offered · 2 inquiries', route: '/referrals/2' },
    ],
  };

  const content = data ?? fallback;

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading my referrals...</Text>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load referrals"
          body="There was a problem loading your referrals."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      {content.referrals.length === 0 ? (
        <EmptyState
          title="No referrals yet"
          body="Request or offer a referral to get started."
          actionLabel="Request referral"
          onAction={() => {}}
        />
      ) : (
        <View style={styles.list}>
          {content.referrals.map((referral) => (
            <AppButton
              key={referral.id}
              label={referral.title}
              route={referral.route}
              variant="secondary"
            />
          ))}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.x3, marginTop: space.x4 },
  loadingText: { color: color.muted, fontSize: typography.body.fontSize, padding: space.x6 },
});
