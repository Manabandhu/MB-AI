import {
  type UseQueryResult,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment, useEffect, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import {
  cancelBooking,
  getMyBookings,
  getMyRides,
  getRide,
  provisionRideChat,
} from '@/modules/rides/api';
import { InlineNotice } from '@/modules/rides/components/InlineNotice';
import { RepeatTripSheet } from '@/modules/rides/components/RepeatTripSheet';
import { formatDeparture, seatsText } from '@/modules/rides/components/RideCard';
import { type TimedNotice, useTimedNotice } from '@/modules/rides/hooks/useTimedNotice';
import type { Ride, RideBooking } from '@/modules/rides/types';
import { showError } from '@/modules/rides/utils/notify';
import {
  errorMessage,
  isNotFound,
  recurrenceLabel,
  statusIs,
  statusLabel,
  statusTone,
} from '@/modules/rides/utils/rideFormat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { useConfirm } from '@/modules/shared/ui/ConfirmSheet';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { OwnerItemCard } from '@/modules/shared/ui/OwnerItemCard';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

type Tab = 'driving' | 'riding';

/** Ride details are loaded for at most this many live bookings; older ones link to the ride instead. */
const MAX_BOOKING_DETAILS = 20;

/** Still ahead of the viewer: not finished, and either under way or departing in the future. */
function isUpcoming(ride: Ride, now = Date.now()) {
  if (statusIs(ride.status, 'completed', 'cancelled')) return false;
  if (statusIs(ride.status, 'in_progress')) return true;
  const t = new Date(ride.departureAt).getTime();
  return !Number.isFinite(t) || t > now;
}

const toTab = (v: string | undefined): Tab =>
  v === 'riding' || v === 'trips' ? 'riding' : 'driving';

/**
 * Upcoming rides the user drives ("Driving") and seats they booked ("Riding"). Past and finished trips live in
 * History (header). `?tab=riding` (or the older `?tab=trips`) opens the second tab.
 */
export function RideMyListingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(toTab(params.tab));
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const [repeatRide, setRepeatRide] = useState<Ride | null>(null);
  const notices = useTimedNotice();

  useEffect(() => {
    setTab(toTab(params.tab));
  }, [params.tab]);

  const ridesQuery = useQuery({
    queryKey: ['rides', 'mine'],
    queryFn: getMyRides,
    enabled: isAuthenticated,
  });
  const bookingsQuery = useQuery({
    queryKey: ['rides', 'my-bookings'],
    queryFn: getMyBookings,
    enabled: isAuthenticated,
  });

  const bookings = bookingsQuery.data ?? [];
  const live = bookings.filter((b) => !statusIs(b.status, 'cancelled'));
  const detailIds = [...new Set(live.map((b) => b.rideId))].slice(0, MAX_BOOKING_DETAILS);
  const rideQueries = useQueries({
    queries: detailIds.map((id) => ({
      queryKey: ['rides', 'detail', id],
      queryFn: () => getRide(id),
    })),
  });
  const rideById = new Map<string, UseQueryResult<Ride>>();
  detailIds.forEach((id, i) => {
    rideById.set(id, rideQueries[i]);
  });
  // A booking whose ride is known to be over belongs to History.
  const upcomingBookings = live.filter((b) => {
    const ride = rideById.get(b.rideId)?.data;
    return !ride || isUpcoming(ride);
  });
  const cancelledBookings = bookings.filter((b) => statusIs(b.status, 'cancelled'));
  const upcomingRides = (ridesQuery.data ?? []).filter((r) => isUpcoming(r));

  const active = tab === 'driving' ? ridesQuery : bookingsQuery;

  return (
    <Screen onRefresh={() => active.refetch()} refreshing={active.isRefetching}>
      <ScreenHeader
        actions={
          <IconButton
            icon="clock"
            label="Ride history"
            onPress={() => router.push('/rides/history' as Href)}
          />
        }
        back={{ fallback: '/rides' as Href }}
        primaryAction={{ label: 'Offer a ride', icon: 'plus', route: '/rides/offer' as Href }}
        subtitle="Upcoming rides you drive and seats you booked"
        title="My rides"
      />
      <SegmentedControl
        label="Ride role"
        onChange={(next) => {
          setTab(next);
          router.setParams({ tab: next === 'driving' ? undefined : next });
        }}
        options={[
          {
            value: 'driving',
            label: 'Driving',
            icon: 'car',
            count: ridesQuery.isSuccess ? upcomingRides.length : undefined,
          },
          {
            value: 'riding',
            label: 'Riding',
            icon: 'user',
            count: bookingsQuery.isSuccess ? upcomingBookings.length : undefined,
          },
        ]}
        value={tab}
      />
      {tab === 'driving' ? (
        <DrivingList
          notice={notices.notice}
          onRepeat={setRepeatRide}
          query={ridesQuery}
          rides={upcomingRides}
        />
      ) : (
        <RidingList
          cancelled={cancelledBookings}
          query={bookingsQuery}
          rideById={rideById}
          upcoming={upcomingBookings}
        />
      )}
      <RepeatTripSheet
        onClose={() => setRepeatRide(null)}
        onPosted={(newRide) => {
          const from = repeatRide?.id ?? newRide.id;
          setRepeatRide(null);
          notices.show({
            anchor: from,
            text: 'Repeat trip posted. Riders can book it now.',
            href: `/rides/${newRide.id}/manage`,
            hrefLabel: 'Manage new ride',
          });
        }}
        ride={repeatRide}
      />
    </Screen>
  );
}

function DrivingList({
  query,
  rides,
  onRepeat,
  notice,
}: {
  query: UseQueryResult<Ride[]>;
  rides: Ride[];
  onRepeat: (ride: Ride) => void;
  notice: TimedNotice | null;
}) {
  const router = useRouter();
  if (query.isLoading || query.isPending) {
    return <LoadingState count={3} label="Loading your rides…" variant="skeleton" />;
  }
  if (query.isError) {
    return (
      <ErrorState
        body={errorMessage(query.error)}
        onRetry={() => query.refetch()}
        retryLabel="Retry"
        title="Could not load your rides"
      />
    );
  }
  if (rides.length === 0) {
    const hasPast = (query.data ?? []).length > 0;
    return (
      <EmptyState
        actionLabel="Offer a ride"
        body={
          hasPast
            ? 'Your past rides are in History, where you can repeat one. Offer a new ride to share costs.'
            : 'Offer a ride to share costs with people going your way.'
        }
        iconName="car"
        onAction={() => router.push('/rides/offer' as Href)}
        title="No upcoming rides"
      />
    );
  }
  return (
    <YStack gap="$x3">
      {rides.map((ride) => (
        <Fragment key={ride.id}>
          <OwnerItemCard
            actions={
              <AppButton
                icon="repeat"
                label="Repeat trip"
                onPress={() => onRepeat(ride)}
                size="sm"
                variant="secondary"
              />
            }
            href={`/rides/${ride.id}/manage` as Href}
            meta={[
              `Departs ${formatDeparture(ride.departureAt)}`,
              seatsText(ride),
              ride.isRecurring ? (recurrenceLabel(ride.recurrencePattern) ?? 'Recurring') : '',
            ]}
            overflow={[
              {
                label: 'View ride page',
                icon: 'eye',
                onPress: () => router.push(`/rides/${ride.id}` as Href),
              },
              {
                label: 'Seat requests',
                icon: 'user',
                onPress: () => router.push(`/rides/${ride.id}/manage?tab=requests` as Href),
              },
              {
                label: 'Riders',
                icon: 'community',
                onPress: () => router.push(`/rides/${ride.id}/manage?tab=riders` as Href),
              },
            ]}
            status={<StatusBadge label={statusLabel(ride.status)} tone={statusTone(ride.status)} />}
            title={ride.routeLabel}
            trailing={ride.contributionLabel ?? undefined}
          />
          {notice?.anchor === ride.id ? <InlineNotice notice={notice} /> : null}
        </Fragment>
      ))}
    </YStack>
  );
}

function RidingList({
  query,
  upcoming,
  cancelled,
  rideById,
}: {
  query: UseQueryResult<RideBooking[]>;
  upcoming: RideBooking[];
  cancelled: RideBooking[];
  rideById: Map<string, UseQueryResult<Ride>>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const notices = useTimedNotice();
  const [showCancelled, setShowCancelled] = useState(false);

  const cancel = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: (_b, bookingId) =>
      notices.show({
        anchor: bookingId,
        text: 'Booking cancelled. Your seat was returned to the driver.',
      }),
    onError: (e) => showError('Could not cancel booking', e),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['rides'] }),
  });

  const chat = useMutation({
    mutationFn: (rideId: string) => provisionRideChat(rideId),
    onSuccess: (res) => router.push(`/chat/${res.conversationId}` as Href),
    onError: (e) => showError('Could not open the ride chat', e),
  });

  const onCancel = async (booking: RideBooking, ride?: Ride) => {
    const ok = await confirm({
      title: 'Cancel this booking?',
      body: `${ride ? `${ride.routeLabel}. ` : ''}Your ${booking.seatsBooked === 1 ? 'seat goes' : 'seats go'} back to the driver and you leave the ride chat.`,
      confirmLabel: 'Cancel booking',
      cancelLabel: 'Keep booking',
      destructive: true,
    });
    if (ok) cancel.mutate(booking.id);
  };

  if (query.isLoading || query.isPending) {
    return <LoadingState count={3} label="Loading your trips…" variant="skeleton" />;
  }
  if (query.isError) {
    return (
      <ErrorState
        body={errorMessage(query.error)}
        onRetry={() => query.refetch()}
        retryLabel="Retry"
        title="Could not load your trips"
      />
    );
  }

  const card = (booking: RideBooking) => {
    const isCancelled = statusIs(booking.status, 'cancelled');
    const rq = rideById.get(booking.rideId);
    const ride = rq?.data;
    const seats = `${booking.seatsBooked} ${booking.seatsBooked === 1 ? 'seat' : 'seats'} booked`;
    const note = rq?.isLoading
      ? 'Loading ride details…'
      : rq?.isError
        ? isNotFound(rq.error)
          ? 'This ride was removed by the driver.'
          : `Ride details failed to load: ${errorMessage(rq.error)}`
        : undefined;
    return (
      <OwnerItemCard
        key={booking.id}
        actions={
          !isCancelled && ride?.isMember ? (
            <AppButton
              icon="message"
              label="Open chat"
              loading={chat.isPending && chat.variables === booking.rideId}
              onPress={() => chat.mutate(booking.rideId)}
              size="sm"
              variant="secondary"
            />
          ) : undefined
        }
        href={`/rides/${booking.rideId}` as Href}
        meta={[
          ride ? `Departs ${formatDeparture(ride.departureAt)}` : '',
          seats,
          booking.createdAt && !ride ? `booked ${formatDeparture(booking.createdAt)}` : '',
        ]}
        note={note}
        overflow={
          isCancelled
            ? undefined
            : [
                {
                  label: 'Cancel booking',
                  icon: 'close',
                  destructive: true,
                  onPress: () => onCancel(booking, ride),
                },
              ]
        }
        status={
          <StatusBadge label={statusLabel(booking.status)} tone={statusTone(booking.status)} />
        }
        title={ride?.routeLabel ?? 'Booked ride'}
        trailing={ride?.contributionLabel ?? undefined}
      />
    );
  };

  return (
    <YStack gap="$x3">
      {upcoming.length === 0 ? (
        <EmptyState
          actionLabel="Find a ride"
          body="Seats you book on upcoming rides appear here. Past trips are in History."
          iconName="car"
          onAction={() => router.push('/rides/search' as Href)}
          title="No upcoming trips"
        />
      ) : (
        upcoming.map(card)
      )}
      {/* A cancelled booking moves into the collapsed list, so its confirmation shows where it was. */}
      <InlineNotice notice={notices.notice} />
      {cancelled.length > 0 ? (
        <XStack>
          <AppButton
            iconAfter={showCancelled ? undefined : 'chevron-down'}
            label={
              showCancelled
                ? 'Hide cancelled bookings'
                : `Show ${cancelled.length} cancelled ${cancelled.length === 1 ? 'booking' : 'bookings'}`
            }
            onPress={() => setShowCancelled((v) => !v)}
            size="sm"
            variant="ghost"
          />
        </XStack>
      ) : null}
      {showCancelled ? cancelled.map(card) : null}
    </YStack>
  );
}
