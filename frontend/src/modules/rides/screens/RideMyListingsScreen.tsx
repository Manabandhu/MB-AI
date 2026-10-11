import {
  type UseQueryResult,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { cancelBooking, getMyBookings, getMyRides, getRide } from '@/modules/rides/api';
import { RepeatTripSheet } from '@/modules/rides/components/RepeatTripSheet';
import { formatDeparture, RideListCard } from '@/modules/rides/components/RideListCard';
import type { Ride, RideBooking } from '@/modules/rides/types';
import { confirmAction, showError } from '@/modules/rides/utils/notify';
import { errorMessage, isNotFound, statusIs, statusLabel } from '@/modules/rides/utils/rideFormat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { Screen } from '@/modules/shared/ui/Screen';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';

type Tab = 'driving' | 'trips';

/** Ride details are loaded for at most this many live bookings; older ones link to the ride instead. */
const MAX_BOOKING_DETAILS = 20;

/** The driver's rides ("Driving") and the rider's bookings ("My trips"). `?tab=trips` opens the second tab. */
export function RideMyListingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'trips' ? 'trips' : 'driving');
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const [repeatRide, setRepeatRide] = useState<Ride | null>(null);
  const [notice, setNotice] = useState<{ text: string; rideId?: string } | null>(null);

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

  const active = tab === 'driving' ? ridesQuery : bookingsQuery;

  return (
    <Screen onRefresh={() => active.refetch()} refreshing={active.isRefetching}>
      <YStack gap="$x4">
        <BackButton fallback="/rides" />
        <XStack alignItems="center" flexWrap="wrap" gap="$x3" justifyContent="space-between">
          <YStack flex={1} gap={2} minWidth={200}>
            <AppText role="heading" variant="h2">
              My rides
            </AppText>
            <AppText tone="muted" variant="caption">
              Rides you drive and seats you booked
            </AppText>
          </YStack>
          <AppButton
            icon="plus"
            label="Offer a ride"
            onPress={() => router.push('/rides/offer' as Href)}
          />
        </XStack>
        <SegmentedControl
          label="Ride role"
          onChange={setTab}
          options={[
            { value: 'driving', label: 'Driving' },
            { value: 'trips', label: 'My trips' },
          ]}
          value={tab}
        />
        {notice ? (
          <Card aria-live="polite" gap="$x2" variant="tinted">
            <AppText variant="label">{notice.text}</AppText>
            {notice.rideId ? (
              <AppButton
                label="View new ride"
                onPress={() => router.push(`/rides/${notice.rideId}` as Href)}
                variant="secondary"
              />
            ) : null}
          </Card>
        ) : null}
        {tab === 'driving' ? (
          <DrivingList onRepeat={setRepeatRide} query={ridesQuery} />
        ) : (
          <TripsList onNotice={(text) => setNotice({ text })} query={bookingsQuery} />
        )}
        <AppButton
          label="Ride history"
          onPress={() => router.push('/rides/history' as Href)}
          variant="ghost"
        />
      </YStack>
      <RepeatTripSheet
        onClose={() => setRepeatRide(null)}
        onPosted={(newRide) => {
          setRepeatRide(null);
          setNotice({ text: 'Repeat trip posted. Riders can book it now.', rideId: newRide.id });
        }}
        ride={repeatRide}
      />
    </Screen>
  );
}

function DrivingList({
  query,
  onRepeat,
}: {
  query: UseQueryResult<Ride[]>;
  onRepeat: (ride: Ride) => void;
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
  const rides = query.data ?? [];
  if (rides.length === 0) {
    return (
      <EmptyState
        actionLabel="Offer a ride"
        body="Offer a ride to share costs with people going your way."
        iconName="car"
        onAction={() => router.push('/rides/offer' as Href)}
        title="You have not offered a ride yet"
      />
    );
  }
  return (
    <YStack gap="$x3">
      {rides.map((ride) => {
        const open = statusIs(ride.status, 'active', 'in_progress');
        return (
          <RideListCard key={ride.id} ride={ride}>
            {open ? (
              <AppButton
                label="Manage"
                onPress={() => router.push(`/rides/${ride.id}/manage` as Href)}
              />
            ) : null}
            {open ? (
              <AppButton
                label="Requests"
                onPress={() => router.push(`/rides/${ride.id}/seat-requests` as Href)}
                variant="secondary"
              />
            ) : null}
            <AppButton
              icon="refresh"
              label="Repeat trip"
              onPress={() => onRepeat(ride)}
              variant="secondary"
            />
            <AppButton
              label="View"
              onPress={() => router.push(`/rides/${ride.id}` as Href)}
              variant="ghost"
            />
          </RideListCard>
        );
      })}
    </YStack>
  );
}

function TripsList({
  query,
  onNotice,
}: {
  query: UseQueryResult<RideBooking[]>;
  onNotice: (text: string) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookings = query.data ?? [];
  const live = bookings.filter((b) => !statusIs(b.status, 'cancelled'));
  const detailIds = [...new Set(live.map((b) => b.rideId))].slice(0, MAX_BOOKING_DETAILS);
  const rideQueries = useQueries({
    queries: detailIds.map((id) => ({
      queryKey: ['rides', 'detail', id],
      queryFn: () => getRide(id),
    })),
  });
  const rideById = new Map<string, (typeof rideQueries)[number]>();
  detailIds.forEach((id, i) => {
    rideById.set(id, rideQueries[i]);
  });

  const cancel = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: () => onNotice('Booking cancelled. Your seat was returned to the driver.'),
    onError: (e) => showError('Could not cancel booking', e),
    onSettled: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['rides', 'my-bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['rides', 'detail'] }),
        queryClient.invalidateQueries({ queryKey: ['rides', 'saved'] }),
        queryClient.invalidateQueries({ queryKey: ['rides', 'offers'] }),
      ]),
  });

  const onCancel = async (booking: RideBooking, ride?: Ride) => {
    const ok = await confirmAction(
      'Cancel this booking?',
      `${ride ? `${ride.routeLabel}. ` : ''}Your ${booking.seatsBooked === 1 ? 'seat goes' : 'seats go'} back to the driver and you leave the ride chat.`,
      'Cancel booking',
    );
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
  if (bookings.length === 0) {
    return (
      <EmptyState
        actionLabel="Find a ride"
        body="Seats you book on other people's rides appear here."
        iconName="car"
        onAction={() => router.push('/rides/search' as Href)}
        title="No trips booked"
      />
    );
  }
  return (
    <YStack gap="$x3">
      {bookings.map((booking) => {
        const cancelled = statusIs(booking.status, 'cancelled');
        const rq = rideById.get(booking.rideId);
        const ride = rq?.data;
        const seatsText = `${booking.seatsBooked} ${booking.seatsBooked === 1 ? 'seat' : 'seats'} · booking ${statusLabel(booking.status).toLowerCase()}`;
        const departed = ride ? new Date(ride.departureAt).getTime() <= Date.now() : false;
        const canCancel =
          !cancelled && !departed && !statusIs(ride?.status, 'completed', 'cancelled');
        const actions = (
          <>
            <AppButton
              label="View ride"
              onPress={() => router.push(`/rides/${booking.rideId}` as Href)}
              variant="secondary"
            />
            {canCancel ? (
              <AppButton
                label="Cancel booking"
                loading={cancel.isPending && cancel.variables === booking.id}
                onPress={() => onCancel(booking, ride)}
                variant="danger"
              />
            ) : null}
          </>
        );
        if (ride) {
          return (
            <RideListCard key={booking.id} note={`Your booking: ${seatsText}`} ride={ride}>
              {actions}
            </RideListCard>
          );
        }
        return (
          <Card gap="$x2" key={booking.id} variant="outlined">
            <XStack alignItems="center" gap="$x2" justifyContent="space-between">
              <AppText variant="bodyStrong">Booked ride</AppText>
              <Chip label={statusLabel(booking.status)} selected={!cancelled} />
            </XStack>
            <AppText tone="muted" variant="caption">
              {seatsText}
              {booking.createdAt ? ` · booked ${formatDeparture(booking.createdAt)}` : ''}
            </AppText>
            {rq?.isLoading ? (
              <AppText tone="muted" variant="caption">
                Loading ride details…
              </AppText>
            ) : rq?.isError ? (
              <AppText tone="danger" variant="caption">
                {isNotFound(rq.error)
                  ? 'This ride was removed by the driver.'
                  : `Ride details failed to load: ${errorMessage(rq.error)}`}
              </AppText>
            ) : null}
            <XStack flexWrap="wrap" gap="$x2">
              {actions}
            </XStack>
          </Card>
        );
      })}
    </YStack>
  );
}
