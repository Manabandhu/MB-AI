import { formatMoney } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { ALL_USA_LOCATION, useLocationStore } from '@/lib/locationStore';
import { WidgetFrame } from '@/modules/shared/components/WidgetFrame';
import { ListRow } from '@/modules/shared/ui/ListRow';
import { listRoomListings } from '../api';

/** Newest rooms in the member's chosen city (or nationwide), for the Home screen. */
export function RoomsHomeWidget() {
  const location = useLocationStore((s) => s.currentLocation);
  const nationwide = location.id === ALL_USA_LOCATION.id;
  const query = useQuery({
    queryKey: ['rooms', 'home-widget', location.id],
    queryFn: () =>
      listRoomListings(
        nationwide ? { size: 4 } : { size: 4, city: location.cityName, state: location.stateCode },
      ),
    staleTime: 60_000,
  });
  const rooms = (query.data ?? []).slice(0, 4);
  return (
    <WidgetFrame
      empty={{
        title: 'No rooms listed here yet',
        body: 'Be the first to list a room, or widen your location.',
        actionLabel: 'List a room',
        actionHref: '/rooms/create-listing',
      }}
      icon="bed"
      isEmpty={rooms.length === 0}
      isError={query.isError}
      isLoading={query.isLoading}
      onRetry={() => query.refetch()}
      seeAll={{ href: '/rooms' }}
      subtitle={nationwide ? 'Across the US' : `Near ${location.name}`}
      title="Rooms near you"
    >
      {rooms.map((room) => (
        <ListRow
          href={`/rooms/${room.id}`}
          icon="bed"
          key={room.id}
          meta={`${formatMoney(room.price, 'USD', { compact: true })}/mo`}
          subtitle={room.broadLocation ?? room.roomType}
          title={room.title}
        />
      ))}
    </WidgetFrame>
  );
}
