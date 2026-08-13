import { useQuery } from '@tanstack/react-query';

import { getFoundationScreenContent } from '@/modules/foundation/catalogApi';
import { foundationScreenFallbacks } from '@/modules/foundation/foundationScreenFallbacks';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

type CatalogContentScreenProps = {
  screenId: keyof typeof screenRoutes;
};

export function CatalogContentScreen({ screenId }: CatalogContentScreenProps) {
  const fallback = foundationScreenFallbacks[screenId];
  const content = useQuery({
    queryKey: ['foundation', 'screen', screenId],
    queryFn: () => getFoundationScreenContent(screenId),
  });
  const data = content.data ?? fallback;

  return (
    <FeatureScreen
      actions={screenActions[screenId]}
      cards={data.items.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        meta: item.meta ?? item.status,
        route: item.route,
      }))}
      currentRoute={screenRoutes[screenId]}
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}

const screenRoutes = {
  onboarding: '/onboarding',
  explore: '/explore',
  search: '/search',
  saved: '/saved',
  profile: '/profile',
  settings: '/settings',
} as const;

const screenActions = {
  onboarding: [
    { label: 'Continue to explore', route: '/explore' },
    { label: 'Profile', route: '/profile' },
  ],
  explore: [
    { label: 'Rooms', route: '/rooms' },
    { label: 'Rides', route: '/rides' },
    { label: 'Notifications', route: '/notifications' },
  ],
  search: [
    { label: 'Search rooms', route: '/rooms/search' },
    { label: 'Search rides', route: '/rides/search' },
  ],
  saved: [
    { label: 'Saved rooms', route: '/rooms/saved' },
    { label: 'Ride filters', route: '/rides/filters' },
  ],
  profile: [
    { label: 'Settings', route: '/settings' },
    { label: 'Notifications', route: '/notifications' },
  ],
  settings: [
    { label: 'Notifications', route: '/notifications' },
    { label: 'Replay welcome', route: '/splash' },
  ],
} as const;
