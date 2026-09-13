import { useQuery } from '@tanstack/react-query';
import { getSafetyCenter } from '@/modules/safety/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';

export function SafetyCenterScreen() {
  const center = useQuery({ queryKey: ['safety', 'center'], queryFn: getSafetyCenter });

  if (center.isLoading) {
    return (
      <ScreenShell>
        <LoadingState />
      </ScreenShell>
    );
  }

  if (center.isError || !center.data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load safety center"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={() => center.refetch()}
        />
      </ScreenShell>
    );
  }

  const data = center.data;

  return (
    <FeatureScreen
      actions={[
        { label: 'Reports', route: '/safety/reports' },
        { label: 'Blocked users', route: '/safety/blocked-users' },
        { label: 'Trusted contacts', route: '/safety/trusted-contacts' },
      ]}
      cards={data.items}
      currentRoute="/safety"
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}
