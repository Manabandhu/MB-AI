import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { getUtilitiesHome } from '@/modules/utilities/api';

export function UtilitiesHomeScreen() {
  const home = useQuery({ queryKey: ['utilities', 'home'], queryFn: getUtilitiesHome });

  if (home.isLoading) {
    return (
      <ScreenShell>
        <LoadingState />
      </ScreenShell>
    );
  }

  if (home.isError || !home.data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to load utilities"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={() => home.refetch()}
        />
      </ScreenShell>
    );
  }

  const data = home.data;

  return (
    <FeatureScreen
      actions={[
        { label: 'Packages', route: '/utilities/packages' },
        { label: 'Nearby', route: '/utilities/nearby' },
        { label: 'Emergency', route: '/utilities/emergency' },
      ]}
      cards={data.items}
      currentRoute="/utilities"
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}
