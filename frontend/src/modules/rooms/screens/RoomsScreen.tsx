import { useQuery } from '@tanstack/react-query';

import { getRoomsScreen } from '@/modules/rooms/api';
import { roomScreenFallbacks } from '@/modules/rooms/roomsFallbacks';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

type RoomsScreenProps = {
  screenId: keyof typeof roomScreenFallbacks;
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
      actions={[
        { label: 'Search', route: '/rooms/search' },
        { label: 'Create listing', route: '/rooms/create-listing' },
      ]}
      cards={data.items}
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}
