import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import { useTheme, XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { shareLink } from '@/lib/share';
import {
  bookRideSeat,
  cancelBooking,
  getRide,
  listParticipants,
  listRideBookings,
  listSeatRequests,
  provisionRideChat,
  updateSeatRequestStatus,
} from '@/modules/rides/api';
import { InlineNotice } from '@/modules/rides/components/InlineNotice';
import { formatDeparture, rideTags, seatsText } from '@/modules/rides/components/RideCard';
import { useSavedRides } from '@/modules/rides/hooks/useSavedRides';
import { useTimedNotice } from '@/modules/rides/hooks/useTimedNotice';
import type { Ride } from '@/modules/rides/types';
import {
  bookingBlockReason,
  durationLabel,
  errorMessage,
  isJoinedRide,
  isNotFound,
  isWomenOnly,
  memberLabel,
  statusIs,
  statusLabel,
  statusTone,
  viewerSeat,
} from '@/modules/rides/utils/rideFormat';
import { ACTION_BAR_SPACE, ActionBar } from '@/modules/shared/ui/ActionBar';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { useConfirm } from '@/modules/shared/ui/ConfirmSheet';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { NumberStepper } from '@/modules/shared/ui/NumberStepper';
import { showError, showMessage } from '@/modules/shared/ui/notify';
import { PersonRow } from '@/modules/shared/ui/PersonRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';
import { useAdaptiveLayout } from '@/platform/adaptive';

/** Ride details from the ride record only, with booking for riders and member actions. */
export function RideDetailScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const authStatus = useAuthStore((s) => s.status);

  // Wait for the session so members get their member-only fields on the first load.
  const rideQuery = useQuery({
    queryKey: ['rides', 'detail', rideId],
    queryFn: () => getRide(rideId),
    enabled: Boolean(rideId) && authStatus !== 'loading',
  });
  const ride = rideQuery.data;

  if (ride) {
    return (
      <RideDetailLoaded
        onRefresh={() => rideQuery.refetch()}
        refreshing={rideQuery.isRefetching}
        ride={ride}
      />
    );
  }

  const header = <ScreenHeader back={{ fallback: '/rides/search' as Href }} title="Ride" />;
  if (rideQuery.isError) {
    return (
      <Screen>
        {header}
        {isNotFound(rideQuery.error) ? (
          <ErrorState
            actionIcon={null}
            body="This ride was removed or the link is wrong."
            onRetry={() => router.replace('/rides/search' as Href)}
            retryLabel="Browse rides"
            title="Ride not found"
          />
        ) : (
          <ErrorState
            body={errorMessage(rideQuery.error)}
            onRetry={() => rideQuery.refetch()}
            retryLabel="Retry"
            title="Could not load this ride"
          />
        )}
      </Screen>
    );
  }
  return (
    <Screen>
      {header}
      <LoadingState label="Loading ride…" />
    </Screen>
  );
}

function RideDetailLoaded({
  ride,
  onRefresh,
  refreshing,
}: {
  ride: Ride;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { windowClass } = useAdaptiveLayout();
  const twoColumns = windowClass === 'expanded' || windowClass === 'wide';
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const saved = useSavedRides();
  const notices = useTimedNotice();
  const [seats, setSeats] = useState(1);

  const isRider = isAuthenticated && !ride.isDriver;
  const bookingsEnabled = isRider && ride.isMember;
  // A rider only ever receives their own bookings and requests.
  const bookingsQuery = useQuery({
    queryKey: ['rides', 'bookings', ride.id],
    queryFn: () => listRideBookings(ride.id),
    enabled: bookingsEnabled,
  });
  const requestsQuery = useQuery({
    queryKey: ['rides', 'seat-requests', ride.id],
    queryFn: () => listSeatRequests(ride.id),
    enabled: isRider,
  });
  const participantsQuery = useQuery({
    queryKey: ['rides', 'participants', ride.id],
    queryFn: () => listParticipants(ride.id),
    enabled: isAuthenticated && ride.isMember,
  });
  const seat = viewerSeat(userId, bookingsQuery.data, requestsQuery.data);
  const pendingRequest = seat?.kind === 'request' && statusIs(seat.status, 'pending');
  // The viewer's own seat: a rider with a booking or an accepted request. Admins are members without one.
  const riderSeated = !ride.isDriver && seat != null && !pendingRequest;
  const seatLookupFailed =
    (bookingsEnabled && bookingsQuery.isError) || (isRider && requestsQuery.isError);
  // Until the rider's own rows are known we cannot tell whether they already hold a seat.
  const seatKnown =
    !isRider || (requestsQuery.isSuccess && (!bookingsEnabled || bookingsQuery.isSuccess));

  const blockReason = bookingBlockReason({ ...ride, isMember: riderSeated });
  const canBook = seatKnown && !blockReason && !pendingRequest;
  const maxSeats = Math.max(1, Math.min(ride.seatsAvailable, 8));
  const finished = statusIs(ride.status, 'completed', 'cancelled');

  useEffect(() => {
    setSeats((s) => Math.min(s, maxSeats));
  }, [maxSeats]);

  const refreshAll = () => queryClient.invalidateQueries({ queryKey: ['rides'] });

  const booking = useMutation({
    mutationFn: (count: number) => bookRideSeat(ride.id, count),
    onSuccess: (b) =>
      notices.show({
        anchor: 'seat',
        text: `Seat booked: ${b.seatsBooked} ${b.seatsBooked === 1 ? 'seat' : 'seats'}. The driver can see your booking.`,
      }),
    // Women-only rides, full rides and duplicate bookings are refused by the server; say why.
    onError: (e) => showError('Seat not booked', e),
    onSettled: refreshAll,
  });

  const cancel = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: () =>
      notices.show({
        anchor: 'seat',
        text: 'Booking cancelled. Your seat went back to the driver.',
      }),
    onError: (e) => showError('Could not cancel booking', e),
    onSettled: refreshAll,
  });

  const withdraw = useMutation({
    mutationFn: (requestId: string) => updateSeatRequestStatus(requestId, 'withdrawn'),
    onSuccess: () => notices.show({ anchor: 'seat', text: 'Seat request withdrawn.' }),
    onError: (e) => showError('Could not withdraw request', e),
    onSettled: refreshAll,
  });

  const chat = useMutation({
    mutationFn: () => provisionRideChat(ride.id),
    onSuccess: (res) => router.push(`/chat/${res.conversationId}` as Href),
    onError: (e) => showError('Could not open the ride chat', e),
  });

  const onBook = async () => {
    if (!isAuthenticated) {
      router.push('/sign-in' as Href);
      return;
    }
    const price =
      ride.contributionAmount != null && ride.contributionAmount > 0
        ? ` You pay the driver $${(ride.contributionAmount * seats).toFixed(2)} directly.`
        : '';
    const ok = await confirm({
      title: `Book ${seats} ${seats === 1 ? 'seat' : 'seats'}?`,
      body: `${ride.routeLabel}, ${formatDeparture(ride.departureAt)}. The seat is yours as soon as you confirm.${price}`,
      confirmLabel: 'Book seat',
    });
    if (ok) booking.mutate(seats);
  };

  const onCancelBooking = async (bookingId: string, count: number) => {
    const ok = await confirm({
      title: 'Cancel your booking?',
      body: `Your ${count === 1 ? 'seat goes' : 'seats go'} back to the driver and you leave the ride chat.`,
      confirmLabel: 'Cancel booking',
      cancelLabel: 'Keep booking',
      destructive: true,
    });
    if (ok) cancel.mutate(bookingId);
  };

  const onWithdraw = async (requestId: string, accepted: boolean) => {
    const ok = await confirm({
      title: 'Withdraw your seat request?',
      body: accepted
        ? 'You give up the seat the driver reserved for you and leave the ride chat.'
        : 'The driver will no longer see this request.',
      confirmLabel: 'Withdraw',
      cancelLabel: 'Keep request',
      destructive: true,
    });
    if (ok) withdraw.mutate(requestId);
  };

  const onShare = async () => {
    try {
      const result = await shareLink(
        `/rides/${ride.id}`,
        `Ride ${ride.routeLabel} on ${formatDeparture(ride.departureAt)}`,
      );
      if (result === 'copied') showMessage('Link copied', 'The ride link is on your clipboard.');
    } catch (e) {
      showError('Could not share this ride', e);
    }
  };

  const isSaved = saved.isSaved(ride.id);
  const header = (
    <ScreenHeader
      actions={
        <>
          {/* Drivers do not bookmark their own ride; the Manage page is their way back to it. */}
          {ride.isDriver ? null : isJoinedRide(ride) ? (
            <Chip icon="check" label="Joined" variant="tag" />
          ) : (
            <IconButton
              disabled={saved.pendingId === ride.id}
              icon="heart"
              label={isSaved ? 'Remove from saved rides' : 'Save ride'}
              onPress={() => saved.toggle(ride.id)}
              variant={isSaved ? 'solid' : 'tinted'}
            />
          )}
          <IconButton icon="share" label="Share ride" onPress={onShare} />
        </>
      }
      back={{ fallback: '/rides/search' as Href }}
      subtitle={`Departs ${formatDeparture(ride.departureAt)}`}
      title={ride.routeLabel}
    />
  );

  // ─── Booking panel (the side column on wide windows) ──────────────────────────────────────────────────────────
  const total =
    ride.contributionAmount != null && ride.contributionAmount > 0
      ? `$${(ride.contributionAmount * seats).toFixed(2)} for ${seats} ${seats === 1 ? 'seat' : 'seats'}, paid to the driver directly.`
      : null;

  let seatPanel: ReactNode = null;
  if (ride.isDriver) {
    seatPanel = (
      <Card gap="$x2" variant="tinted">
        <Heading variant="h4">You drive this ride</Heading>
        <AppText tone="muted" variant="caption">
          Bookings, seat requests and riders are on the Manage page.
        </AppText>
        <XStack flexWrap="wrap" gap="$x2">
          <AppButton
            label="Riders"
            onPress={() => router.push(`/rides/${ride.id}/manage?tab=riders` as Href)}
            size="sm"
            variant="secondary"
          />
          <AppButton
            label="Seat requests"
            onPress={() => router.push(`/rides/${ride.id}/manage?tab=requests` as Href)}
            size="sm"
            variant="secondary"
          />
        </XStack>
      </Card>
    );
  } else if (seatLookupFailed) {
    seatPanel = (
      <ErrorState
        body={errorMessage(bookingsQuery.error ?? requestsQuery.error)}
        compact
        onRetry={() => {
          if (bookingsQuery.isError) bookingsQuery.refetch();
          if (requestsQuery.isError) requestsQuery.refetch();
        }}
        retryLabel="Retry"
        title="Could not check your seat on this ride"
      />
    );
  } else if (seat) {
    const accepted = seat.kind === 'request' && statusIs(seat.status, 'accepted');
    seatPanel = (
      <Card gap="$x3" variant="tinted">
        <XStack alignItems="center" flexWrap="wrap" gap="$x2" justifyContent="space-between">
          <Heading variant="h4">
            {seat.kind === 'booking' ? 'Your booking' : 'Your seat request'}
          </Heading>
          <StatusBadge label={statusLabel(seat.status)} tone={statusTone(seat.status)} />
        </XStack>
        <AppText tone="muted" variant="caption">
          {seat.seats} {seat.seats === 1 ? 'seat' : 'seats'}
          {seat.kind === 'booking' || accepted
            ? '. Use the ride chat to agree on the exact pickup point.'
            : '. The driver has not answered yet.'}
        </AppText>
        {!finished ? (
          <XStack flexWrap="wrap" gap="$x2">
            {seat.kind === 'booking' || accepted ? (
              <AppButton
                icon="message"
                label="Open chat"
                loading={chat.isPending}
                onPress={() => chat.mutate()}
                size="sm"
                variant="secondary"
              />
            ) : null}
            {seat.kind === 'booking' ? (
              <AppButton
                label="Cancel booking"
                loading={cancel.isPending}
                onPress={() => onCancelBooking(seat.id, seat.seats)}
                size="sm"
                variant="ghost"
              />
            ) : (
              <AppButton
                label="Withdraw request"
                loading={withdraw.isPending}
                onPress={() => onWithdraw(seat.id, accepted)}
                size="sm"
                variant="ghost"
              />
            )}
          </XStack>
        ) : null}
        <InlineNotice notice={notices.at('seat')} />
      </Card>
    );
  } else if (canBook) {
    seatPanel = (
      <Card gap="$x3" variant="outlined">
        <Heading variant="h4">Book a seat</Heading>
        {maxSeats > 1 ? (
          <NumberStepper
            helper={`Up to ${maxSeats} on this ride.`}
            label="Seats"
            max={maxSeats}
            min={1}
            onChange={setSeats}
            value={seats}
          />
        ) : (
          <AppText tone="muted" variant="caption">
            One seat left.
          </AppText>
        )}
        {total ? (
          <AppText tone="muted" variant="caption">
            {total}
          </AppText>
        ) : null}
        <InlineNotice notice={notices.at('seat')} />
      </Card>
    );
  } else if (!seatKnown) {
    seatPanel = <LoadingState count={1} label="Checking your seat…" variant="skeleton" />;
  } else {
    seatPanel = (
      <Card gap="$x2" variant="filled">
        <AppText variant="bodyStrong">{blockReason}</AppText>
        <InlineNotice notice={notices.at('seat')} />
      </Card>
    );
  }

  const pricePanel = (
    <Card gap="$x2" variant="outlined">
      <XStack alignItems="center" flexWrap="wrap" gap="$x2" justifyContent="space-between">
        <AppText tone="primary" variant="h2">
          {ride.contributionLabel ?? 'Price not set'}
        </AppText>
        <StatusBadge label={statusLabel(ride.status)} tone={statusTone(ride.status)} />
      </XStack>
      <AppText tone={ride.seatsAvailable > 0 && !finished ? 'teal' : 'muted'} variant="label">
        {seatsText(ride)}
      </AppText>
    </Card>
  );

  // ─── Ride facts (the main column) ───────────────────────────────────────────────────────────────────────────
  const tags = rideTags(ride, { distance: false });
  const duration = durationLabel(ride.estimatedDurationMins);
  const people = participantsQuery.data ?? [];
  const facts = (
    <YStack gap="$x4">
      <Card gap="$x3" variant="outlined">
        <Heading variant="h4">Route</Heading>
        <XStack alignItems="center" gap="$x3">
          <AppIcon color={theme.teal?.val} name="map-pin" size={18} />
          <YStack flex={1}>
            <AppText tone="muted" variant="caption">
              Pickup area
            </AppText>
            <AppText variant="bodyStrong">{ride.originArea}</AppText>
          </YStack>
        </XStack>
        <XStack alignItems="center" gap="$x3">
          <AppIcon color={theme.warm?.val} name="map-pin" size={18} />
          <YStack flex={1}>
            <AppText tone="muted" variant="caption">
              Destination
            </AppText>
            <AppText variant="bodyStrong">{ride.destinationArea}</AppText>
          </YStack>
        </XStack>
        {duration || ride.distanceMiles ? (
          <AppText tone="muted" variant="caption">
            {[ride.distanceMiles ? `${ride.distanceMiles.toFixed(1)} mi` : null, duration]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
        ) : null}
        {!ride.isMember ? (
          <AppText tone="muted" variant="caption">
            Exact pickup details are shared with riders after they book.
          </AppText>
        ) : null}
        {tags.length > 0 || ride.estimatedTollAmount ? (
          <XStack flexWrap="wrap" gap="$x2">
            {tags.map((t) => (
              <Chip key={t} label={t} variant="tag" />
            ))}
            {ride.estimatedTollAmount ? (
              <Chip label={`Tolls about $${ride.estimatedTollAmount.toFixed(2)}`} variant="tag" />
            ) : null}
          </XStack>
        ) : null}
      </Card>

      {isWomenOnly(ride.genderPreference) && !ride.isDriver ? (
        <Card gap="$x1" variant="tinted">
          <Heading variant="h4">Women-only ride</Heading>
          <AppText tone="muted" variant="caption">
            Only riders whose gender has been verified by ManaBandhu can book this ride. If yours is
            not verified yet, booking will be refused.
          </AppText>
        </Card>
      ) : null}

      {ride.isMember && isAuthenticated ? (
        <YStack gap="$x2">
          <Heading variant="h4">On this ride</Heading>
          {participantsQuery.isLoading ? (
            <LoadingState count={2} label="Loading riders…" variant="skeleton" />
          ) : participantsQuery.isError ? (
            <ErrorState
              body={errorMessage(participantsQuery.error)}
              compact
              onRetry={() => participantsQuery.refetch()}
              retryLabel="Retry"
              title="Could not load who is on this ride"
            />
          ) : people.length === 0 ? (
            <AppText tone="muted" variant="caption">
              Nobody has joined yet.
            </AppText>
          ) : (
            people.map((p) => (
              <PersonRow
                badge={
                  statusIs(p.role, 'driver') ? (
                    <StatusBadge label="Driver" tone="primary" />
                  ) : undefined
                }
                key={p.id}
                name={p.userId === userId ? 'You' : memberLabel(p.userId, p.role)}
                subtitle={p.joinedAt ? `Joined ${formatDeparture(p.joinedAt)}` : null}
              />
            ))
          )}
        </YStack>
      ) : null}

      <Card gap="$x2" variant="outlined">
        <XStack alignItems="center" gap="$x2">
          <AppIcon color={theme.primary?.val} name="shield" size={18} />
          <Heading variant="h4">Riding safely</Heading>
        </XStack>
        <AppText tone="muted" variant="caption">
          Meet at a public pickup point and confirm the driver before you get in. Tell a trusted
          contact about your trip, and report anything that feels wrong.
        </AppText>
        <XStack>
          <AppButton
            icon="shield"
            label="Open Safety Center"
            route="/safety"
            size="sm"
            variant="ghost"
          />
        </XStack>
      </Card>
    </YStack>
  );

  const side = (
    <YStack gap="$x4">
      {pricePanel}
      {seatPanel}
    </YStack>
  );

  // ─── Sticky action bar ────────────────────────────────────────────────────────────────────────────────────────
  let primary: ReactNode = null;
  if (ride.isDriver) {
    primary = (
      <AppButton
        icon="settings"
        label="Manage ride"
        onPress={() => router.push(`/rides/${ride.id}/manage` as Href)}
      />
    );
  } else if (riderSeated && statusIs(ride.status, 'completed')) {
    primary = (
      <AppButton
        icon="star"
        label="Rate driver"
        onPress={() => router.push(`/rides/${ride.id}/rate` as Href)}
      />
    );
  } else if (riderSeated && !statusIs(ride.status, 'cancelled')) {
    primary = (
      <AppButton
        icon="message"
        label="Open chat"
        loading={chat.isPending}
        onPress={() => chat.mutate()}
      />
    );
  } else if (canBook) {
    primary = (
      <AppButton
        icon="check"
        label={
          isAuthenticated ? `Book ${seats} ${seats === 1 ? 'seat' : 'seats'}` : 'Sign in to book'
        }
        loading={booking.isPending}
        onPress={onBook}
      />
    );
  }

  return (
    <YStack backgroundColor="$background" flex={1}>
      <Screen bottomInset={ACTION_BAR_SPACE} onRefresh={onRefresh} refreshing={refreshing}>
        {header}
        {twoColumns ? (
          <XStack alignItems="flex-start" gap="$x6">
            <YStack flex={3} minWidth={0}>
              {facts}
            </YStack>
            <YStack flex={2} minWidth={0}>
              {side}
            </YStack>
          </XStack>
        ) : (
          <YStack gap="$x4">
            {side}
            {facts}
          </YStack>
        )}
      </Screen>
      <ActionBar
        label="Ride actions"
        leading={
          <YStack gap={2}>
            <AppText numberOfLines={1} tone="primary" variant="h4">
              {ride.contributionLabel ?? 'Price not set'}
            </AppText>
            <AppText numberOfLines={1} tone="muted" variant="caption">
              {primary || riderSeated || !seatKnown
                ? seatsText(ride)
                : (blockReason ?? seatsText(ride))}
            </AppText>
          </YStack>
        }
      >
        {primary}
      </ActionBar>
    </YStack>
  );
}
