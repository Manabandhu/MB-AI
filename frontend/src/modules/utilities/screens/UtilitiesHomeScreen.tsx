import { useQuery } from '@tanstack/react-query';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { getUtilitiesHome } from '@/modules/utilities/api';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

const DEFAULT_UTILITIES_DATA: CatalogScreenContent = {
  title: 'Texas Utilities & Essentials',
  subtitle: 'Setup electricity, high-speed fiber internet, and local services in Austin & DFW.',
  eyebrow: 'Moving & Setup',
  metrics: [
    { label: 'Top Providers', value: '8' },
    { label: 'Student Deals', value: '5' },
  ],
  items: [
    { id: 'power', title: 'Electricity (Power to Choose)', body: 'Compare fixed vs variable electric rates in deregulated Texas energy markets.', meta: 'Electricity', route: '/utilities/packages' },
    { id: 'internet', title: 'AT&T Fiber & Google Fiber', body: 'Check gigabit fiber availability, student discounts, and router setup tips.', meta: 'Internet', route: '/utilities/packages' },
    { id: 'city-water', title: 'City of Austin Water & Trash', body: 'Residential utility account transfer and deposit waiver requirements.', meta: 'Municipal', route: '/utilities/nearby' },
  ],
};

export function UtilitiesHomeScreen() {
  const home = useQuery({ queryKey: ['utilities', 'home'], queryFn: getUtilitiesHome, retry: false });

  if (home.isLoading) {
    return (
      <ScreenShell>
        <LoadingState />
      </ScreenShell>
    );
  }

  const data = home.data ?? DEFAULT_UTILITIES_DATA;

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
