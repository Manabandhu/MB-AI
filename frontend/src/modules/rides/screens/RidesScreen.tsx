import { useQuery } from '@tanstack/react-query';

import { getRidesScreen } from '@/modules/rides/api';
import { rideScreenFallbacks } from '@/modules/rides/ridesFallbacks';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

type RidesScreenProps = {
  screenId: keyof typeof rideScreenFallbacks;
};

export function RidesScreen({ screenId }: RidesScreenProps) {
  const fallback = rideScreenFallbacks[screenId];
  const screen = useQuery({
    queryKey: ['rides', 'screen', screenId],
    queryFn: () => getRidesScreen(screenId),
  });
  const data = screen.data ?? fallback;

  return (
    <FeatureScreen
      actions={[
        { label: 'Search', route: '/rides/search' },
        { label: 'Offer ride', route: '/rides/offer' },
      ]}
      cards={data.items}
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}
