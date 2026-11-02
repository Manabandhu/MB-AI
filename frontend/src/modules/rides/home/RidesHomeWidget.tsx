import { formatDate } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/authStore';
import { persistMeta } from '@/lib/queryPersistence';
import { ListRow } from '@/modules/shared/ui/ListRow';
import { WidgetFrame } from '@/modules/shared/ui/WidgetFrame';
import { getMyBookings, getMyRides, getRide, listRideOffers } from '../api';
import type { Ride } from '../types';
import { statusIs } from '../utils/rideFormat';

/** Rows shown in the widget, the viewer's next trip included. */
const ROWS = 3;
/** Public offers fetched; enough to fill the rows after removing full or past rides. */
const FETCH_SIZE = 10;
/** Booked rides looked up to find the next trip (one request each), the same cap as My rides. */
const BOOKING_LOOKUPS = 20;

function upcoming(ride: Ride, now: number) {
  if (statusIs(ride.status, 'completed', 'cancelled')) return false;
  return statusIs(ride.status, 'in_progress') || new Date(ride.departureAt).getTime() > now;
}

const byDeparture = (a: Ride, b: Ride) =>
  new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime();

/**
 * The signed-in user's soonest upcoming ride, driving or booked, or null. Every live booking's ride is looked up
 * (up to the cap); any failed lookup fails the query, so the widget never labels a ride "next" from partial data.
 * Never persisted (per-user data).
 */
async function nextTrip(): Promise<Ride | null> {
  const [mine, bookings] = await Promise.all([getMyRides(), getMyBookings()]);
  const now = Date.now();
  const bookedIds = [
    ...new Set(bookings.filter((b) => !statusIs(b.status, 'cancelled')).map((b) => b.rideId)),
  ].slice(0, BOOKING_LOOKUPS);
  const booked = await Promise.all(bookedIds.map((id) => getRide(id)));
  const candidates = [...mine, ...booked].filter((r) => upcoming(r, now));
  return candidates.sort(byDeparture)[0] ?? null;
}

const price = (ride: Ride) => ride.contributionLabel ?? undefined;

/** The viewer's next trip first (when signed in), then upcoming ride offers with open seats, soonest first. */
export function RidesHomeWidget() {
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const query = useQuery({
    queryKey: ['rides', 'home-widget'],
    queryFn: () => listRideOffers({ size: FETCH_SIZE }),
    staleTime: 60_000,
    meta: persistMeta,
  });
  const nextQuery = useQuery({
    queryKey: ['rides', 'home-next-trip'],
    queryFn: nextTrip,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const now = Date.now();
  // Only a fully successful lookup may name the next trip; otherwise show public offers without that label.
  const next = isAuthenticated && nextQuery.isSuccess ? nextQuery.data : null;
  const open = (query.data ?? [])
    .filter((ride) => ride.id !== next?.id && ride.seatsAvailable > 0 && upcoming(ride, now))
    .sort(byDeparture)
    .slice(0, next ? ROWS - 1 : ROWS);

  return (
    <WidgetFrame
      empty={{
        title: 'No upcoming rides',
        body: 'Offer a ride to share costs with people going your way.',
        actionLabel: 'Offer a ride',
        actionHref: '/rides/offer',
      }}
      icon="car"
      isEmpty={!next && open.length === 0}
      isError={query.isError && !next}
      isLoading={query.isLoading}
      onRetry={() => query.refetch()}
      seeAll={{ href: '/rides' }}
      title="Upcoming rides"
    >
      {next ? (
        <ListRow
          href={next.isDriver ? `/rides/${next.id}/manage` : `/rides/${next.id}`}
          icon="calendar"
          meta={price(next)}
          subtitle={`Your next trip · ${next.isDriver ? 'You drive' : 'You ride'} · ${formatDate(next.departureAt, 'weekdayTime') ?? ''}`}
          title={next.routeLabel}
          tone="teal"
        />
      ) : null}
      {open.map((ride) => (
        <ListRow
          href={`/rides/${ride.id}`}
          icon="car"
          key={ride.id}
          meta={price(ride)}
          subtitle={`${formatDate(ride.departureAt, 'weekdayTime') ?? ''} · ${ride.seatsAvailable} ${ride.seatsAvailable === 1 ? 'seat' : 'seats'} open`}
          title={ride.routeLabel}
          tone="teal"
        />
      ))}
    </WidgetFrame>
  );
}
