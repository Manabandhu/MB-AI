import { useQuery } from '@tanstack/react-query';

import { getRidesScreen } from '@/modules/rides/api';
import { rideScreenFallbacks } from '@/modules/rides/ridesFallbacks';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

type RidesScreenProps = {
  screenId: keyof typeof rideRoutes;
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
      actions={rideActions[screenId]}
      cards={data.items}
      currentRoute={rideRoutes[screenId]}
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}

const rideRoutes = {
  home: '/rides',
  search: '/rides/search',
  map: '/rides/map',
  filters: '/rides/filters',
  offer: '/rides/offer',
} as const;

const rideActions = {
  home: [
    { label: 'Search', route: '/rides/search' },
    { label: 'Map', route: '/rides/map' },
    { label: 'Offer ride', route: '/rides/offer' },
  ],
  search: [
    { label: 'Filters', route: '/rides/filters' },
    { label: 'Map', route: '/rides/map' },
    { label: 'Offer ride', route: '/rides/offer' },
  ],
  map: [
    { label: 'Search list', route: '/rides/search' },
    { label: 'Filters', route: '/rides/filters' },
  ],
  filters: [
    { label: 'Apply to search', route: '/rides/search' },
    { label: 'Map', route: '/rides/map' },
  ],
  offer: [
    { label: 'Review rides', route: '/rides' },
    { label: 'Search rides', route: '/rides/search' },
  ],
} as const;
