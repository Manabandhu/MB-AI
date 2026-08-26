import { useQuery } from '@tanstack/react-query';

import { getRidesScreen } from '@/modules/rides/api';
import { rideScreenFallbacks } from '@/modules/rides/ridesFallbacks';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

export type RidesScreenId =
  | 'home'
  | 'search'
  | 'map'
  | 'filters'
  | 'offer'
  | 'request'
  | 'saved'
  | 'mine'
  | 'history'
  | 'details'
  | 'manage'
  | 'seat-requests'
  | 'participants'
  | 'rate';

type RidesScreenProps = {
  screenId: RidesScreenId;
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

const rideRoutes: Record<RidesScreenId, string> = {
  home: '/rides',
  search: '/rides/search',
  map: '/rides/map',
  filters: '/rides/filters',
  offer: '/rides/offer',
  request: '/rides/request',
  saved: '/rides/saved',
  mine: '/rides/mine',
  history: '/rides/history',
  details: '/rides/demo-ride-1',
  manage: '/rides/demo-ride-1/manage',
  'seat-requests': '/rides/demo-ride-1/seat-requests',
  participants: '/rides/demo-ride-1/participants',
  rate: '/rides/demo-ride-1/rate',
};

const rideActions: Record<RidesScreenId, readonly { label: string; route: string }[]> = {
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
  request: [
    { label: 'Search rides', route: '/rides/search' },
    { label: 'Offer ride', route: '/rides/offer' },
  ],
  saved: [
    { label: 'Ride details', route: '/rides/demo-ride-1' },
    { label: 'Search more', route: '/rides/search' },
  ],
  mine: [
    { label: 'Manage ride', route: '/rides/demo-ride-1/manage' },
    { label: 'Seat requests', route: '/rides/demo-ride-1/seat-requests' },
  ],
  history: [
    { label: 'Rate ride', route: '/rides/demo-ride-1/rate' },
    { label: 'Search rides', route: '/rides/search' },
  ],
  details: [
    { label: 'Manage ride', route: '/rides/demo-ride-1/manage' },
    { label: 'Seat requests', route: '/rides/demo-ride-1/seat-requests' },
  ],
  manage: [
    { label: 'View details', route: '/rides/demo-ride-1' },
    { label: 'Participants', route: '/rides/demo-ride-1/participants' },
  ],
  'seat-requests': [
    { label: 'Manage ride', route: '/rides/demo-ride-1/manage' },
    { label: 'View details', route: '/rides/demo-ride-1' },
  ],
  participants: [
    { label: 'Manage ride', route: '/rides/demo-ride-1/manage' },
    { label: 'View details', route: '/rides/demo-ride-1' },
  ],
  rate: [
    { label: 'Ride history', route: '/rides/history' },
    { label: 'View details', route: '/rides/demo-ride-1' },
  ],
};
