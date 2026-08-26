import { color, radius, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type UscisAlert = {
  id: string;
  title: string;
  body: string;
  meta?: string;
  route?: string;
};

type UscisContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  alerts: UscisAlert[];
};

export function UscisScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['immigration', 'uscis'],
    queryFn: async (): Promise<UscisContent> => {
      const response = await apiFetch('/api/v1/immigration/uscis');
      if (!response.ok) throw new Error(`USCIS failed: ${response.status}`);
      return response.json() as Promise<UscisContent>;
    },
  });

  const fallback: UscisContent = {
    eyebrow: 'Immigration',
    title: 'USCIS alerts',
    subtitle: 'Latest updates from USCIS.',
    alerts: [
      {
        id: '1',
        title: 'Fee increase notice',
        body: 'New fees effective October 2024.',
        meta: 'Alert',
        route: '/immigration/resources/1',
      },
      {
        id: '2',
        title: 'Policy manual update',
        body: 'Changes to employment authorization policies.',
        meta: 'Update',
        route: '/immigration/resources/2',
      },
    ],
  };

  const content = data ?? fallback;

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Loading alerts...</Text>
      </ScreenShell>
    );
  }

  if (error) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load alerts"
          body="There was a problem loading USCIS alerts."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          USCIS updates are provided for reference only. Consult an attorney for legal advice.
        </Text>
      </View>
      {content.alerts.length === 0 ? (
        <EmptyState
          title="No alerts"
          body="Check back later for updates."
          actionLabel="Browse resources"
          onAction={() => {}}
        />
      ) : (
        <View style={styles.list}>
          {content.alerts.map((alert) => (
            <AppButton key={alert.id} label={alert.title} route={alert.route} variant="secondary" />
          ))}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.x3, marginTop: space.x4 },
  loadingText: { color: color.muted, fontSize: typography.body.fontSize, padding: space.x6 },
  banner: {
    backgroundColor: color.primarySoft,
    borderRadius: radius.control,
    padding: space.x4,
  },
  bannerText: {
    color: color.ink,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
});
