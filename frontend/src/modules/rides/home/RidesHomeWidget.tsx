import { formatDate } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { persistMeta } from '@/lib/queryPersistence';
import { WidgetFrame } from '@/modules/shared/components/WidgetFrame';
import { ListRow } from '@/modules/shared/ui/ListRow';
import { listRideOffers } from '../api';

/** Upcoming ride offers with open seats, soonest first. */
export function RidesHomeWidget() {
  const query = useQuery({
    queryKey: ['rides', 'home-widget'],
    queryFn: () => listRideOffers(),
    staleTime: 60_000,
    meta: persistMeta,
  });
  const now = Date.now();
  const rides = (query.data ?? [])
    .filter((ride) => ride.seatsAvailable > 0 && new Date(ride.departureAt).getTime() > now)
    .sort((a, b) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime())
    .slice(0, 3);
  return (
    <WidgetFrame
      empty={{
        title: 'No upcoming rides',
        body: 'Offer a ride to share costs, or request one for your trip.',
        actionLabel: 'Offer a ride',
        actionHref: '/rides/offer',
      }}
      icon="car"
      isEmpty={rides.length === 0}
      isError={query.isError}
      isLoading={query.isLoading}
      onRetry={() => query.refetch()}
      seeAll={{ href: '/rides' }}
      title="Upcoming rides"
    >
      {rides.map((ride) => (
        <ListRow
          href={`/rides/${ride.id}`}
          icon="car"
          key={ride.id}
          meta={`${ride.seatsAvailable} ${ride.seatsAvailable === 1 ? 'seat' : 'seats'}`}
          subtitle={formatDate(ride.departureAt, 'weekdayTime')}
          title={`${ride.originArea} → ${ride.destinationArea}`}
          tone="teal"
        />
      ))}
    </WidgetFrame>
  );
}
