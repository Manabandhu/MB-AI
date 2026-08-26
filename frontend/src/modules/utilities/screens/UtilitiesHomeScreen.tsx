import { useQuery } from '@tanstack/react-query';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';
import { getUtilitiesHome } from '@/modules/utilities/api';
import { utilitiesHomeFallback } from '@/modules/utilities/utilitiesFallbacks';

export function UtilitiesHomeScreen() {
  const home = useQuery({ queryKey: ['utilities', 'home'], queryFn: getUtilitiesHome });
  const data = home.data ?? utilitiesHomeFallback;

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
