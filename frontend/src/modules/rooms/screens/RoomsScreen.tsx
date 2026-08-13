import { useQuery } from '@tanstack/react-query';

import { getRoomsScreen } from '@/modules/rooms/api';
import { roomScreenFallbacks } from '@/modules/rooms/roomsFallbacks';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

type RoomsScreenProps = {
  screenId: keyof typeof roomRoutes;
};

export function RoomsScreen({ screenId }: RoomsScreenProps) {
  const fallback = roomScreenFallbacks[screenId];
  const screen = useQuery({
    queryKey: ['rooms', 'screen', screenId],
    queryFn: () => getRoomsScreen(screenId),
  });
  const data = screen.data ?? fallback;

  return (
    <FeatureScreen
      actions={roomActions[screenId]}
      cards={data.items}
      currentRoute={roomRoutes[screenId]}
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}

const roomRoutes = {
  home: '/rooms',
  search: '/rooms/search',
  map: '/rooms/map',
  filters: '/rooms/filters',
  saved: '/rooms/saved',
  'my-listings': '/rooms/my-listings',
  'create-listing': '/rooms/create-listing',
  details: '/rooms/demo-room-1',
  edit: '/rooms/demo-room-1/edit',
} as const;

const roomActions = {
  home: [
    { label: 'Search', route: '/rooms/search' },
    { label: 'Map', route: '/rooms/map' },
    { label: 'Saved', route: '/rooms/saved' },
    { label: 'Create listing', route: '/rooms/create-listing' },
  ],
  search: [
    { label: 'Filters', route: '/rooms/filters' },
    { label: 'Map', route: '/rooms/map' },
    { label: 'Saved', route: '/rooms/saved' },
  ],
  map: [
    { label: 'Search list', route: '/rooms/search' },
    { label: 'Filters', route: '/rooms/filters' },
  ],
  filters: [
    { label: 'Apply to search', route: '/rooms/search' },
    { label: 'Map', route: '/rooms/map' },
  ],
  saved: [
    { label: 'Room details', route: '/rooms/demo-room-1' },
    { label: 'Search more', route: '/rooms/search' },
  ],
  'my-listings': [
    { label: 'Create listing', route: '/rooms/create-listing' },
    { label: 'Edit listing', route: '/rooms/demo-room-1/edit' },
  ],
  'create-listing': [
    { label: 'My listings', route: '/rooms/my-listings' },
    { label: 'Preview details', route: '/rooms/demo-room-1' },
  ],
  details: [
    { label: 'Edit listing', route: '/rooms/demo-room-1/edit' },
    { label: 'Saved rooms', route: '/rooms/saved' },
    { label: 'Search more', route: '/rooms/search' },
  ],
  edit: [
    { label: 'View details', route: '/rooms/demo-room-1' },
    { label: 'My listings', route: '/rooms/my-listings' },
  ],
} as const;
