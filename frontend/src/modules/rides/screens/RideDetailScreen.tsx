import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTheme, XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { shareLink } from '@/lib/share';
import {
  bookRideSeat,
  getRide,
  getSavedRides,
  provisionRideChat,
  saveRide,
  unsaveRide,
} from '@/modules/rides/api';
import { formatDeparture } from '@/modules/rides/components/RideListCard';
import type { Ride } from '@/modules/rides/types';
import { confirmAction, showError, showMessage } from '@/modules/rides/utils/notify';
import {
  bookingBlockReason,
  durationLabel,
  errorMessage,
  genderLabel,
  isNotFound,
  isWomenOnly,
  luggageLabel,
  recurrenceLabel,
  statusIs,
  statusLabel,
  tollLabel,
} from '@/modules/rides/utils/rideFormat';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { Screen } from '@/modules/shared/ui/Screen';

/** Ride details from the ride record only, with booking for riders and member actions. */
export function RideDetailScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const queryClient = useQueryClient();
  const authStatus = useAuthStore((s) => s.status);
  const isAuthenticated = authStatus === 'authenticated';

  // Wait for the session so members get their member-only fields on the first load.
  const rideQuery = useQuery({
    queryKey: ['rides', 'detail', rideId],
    queryFn: () => getRide(rideId),
    enabled: Boolean(rideId) && authStatus !== 'loading',
  });
  const savedQuery = useQuery({
    queryKey: ['rides', 'saved'],
    queryFn: getSavedRides,
    enabled: isAuthenticated,
  });
  const ride = rideQuery.data;
  const isSaved = useMemo(
    () => savedQuery.data?.some((r) => r.id === rideId) ?? false,
    [savedQuery.data, rideId],
  );

  const saveMutation = useMutation({
    mutationFn: async (save: boolean) => {
      if (save) await saveRide(rideId);
      else await unsaveRide(rideId);
    },
    onError: (e, save) =>
      showError(save ? 'Could not save ride' : 'Could not remove saved ride', e),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['rides', 'saved'] }),
  });

  const chatMutation = useMutation({
    mutationFn: () => provisionRideChat(rideId),
    onSuccess: (res) => router.push(`/chat/${res.conversationId}` as Href),
    onError: (e) => showError('Could not open the ride chat', e),
  });

  const onToggleSave = () => {
    if (!isAuthenticated) {
      router.push('/sign-in' as Href);
      return;
    }
    saveMutation.mutate(!isSaved);
  };

  const onShare = async () => {
    if (!ride) return;
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

  const content = () => {
    if (rideQuery.isLoading || authStatus === 'loading') {
      return <LoadingState label="Loading ride…" />;
    }
    if (rideQuery.isError || !ride) {
      if (isNotFound(rideQuery.error)) {
        return (
          <ErrorState
            body="This ride was removed or the link is wrong."
            onRetry={() => router.replace('/rides/search' as Href)}
            retryLabel="Browse rides"
            title="Ride not found"
          />
        );
      }
      return (
        <ErrorState
          body={errorMessage(rideQuery.error)}
          onRetry={() => rideQuery.refetch()}
          retryLabel="Retry"
          title="Could not load this ride"
        />
      );
    }
    return <RideDetailBody isAuthenticated={isAuthenticated} ride={ride} />;
  };

  return (
    <Screen onRefresh={() => rideQuery.refetch()} refreshing={rideQuery.isRefetching}>
      <YStack gap="$x4">
        <XStack alignItems="center" justifyContent="space-between">
          <BackButton fallback="/rides" />
          {ride ? (
            <XStack gap="$x2">
              <IconButton
                icon="bookmark"
                label={isSaved ? 'Remove from saved rides' : 'Save ride'}
                onPress={onToggleSave}
                variant={isSaved ? 'solid' : 'tinted'}
              />
              <IconButton icon="share" label="Share ride" onPress={onShare} />
              {ride.isMember ? (
                <IconButton
                  icon="message"
                  label="Open ride chat"
                  onPress={() => chatMutation.mutate()}
                />
              ) : null}
            </XStack>
          ) : null}
        </XStack>
        {content()}
      </YStack>
    </Screen>
  );
}

function RideDetailBody({ ride, isAuthenticated }: { ride: Ride; isAuthenticated: boolean }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [seats, setSeats] = useState(1);
  const [booked, setBooked] = useState<number | null>(null);
  const blockReason = bookingBlockReason(ride);
  const maxSeats = Math.max(1, Math.min(ride.seatsAvailable, 8));

  useEffect(() => {
    setSeats((s) => Math.min(s, maxSeats));
  }, [maxSeats]);

  const booking = useMutation({
    mutationFn: (count: number) => bookRideSeat(ride.id, count),
    onSuccess: (b) => {
      setBooked(b.seatsBooked);
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['rides', 'detail', ride.id] }),
        queryClient.invalidateQueries({ queryKey: ['rides', 'offers'] }),
        queryClient.invalidateQueries({ queryKey: ['rides', 'saved'] }),
        queryClient.invalidateQueries({ queryKey: ['rides', 'my-bookings'] }),
      ]);
    },
    // Women-only rides, full rides and duplicate bookings are refused by the server; say why.
    onError: (e) => showError('Seat not booked', e),
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
    const ok = await confirmAction(
      `Book ${seats} ${seats === 1 ? 'seat' : 'seats'}?`,
      `${ride.routeLabel}, ${formatDeparture(ride.departureAt)}. The seat is yours as soon as you confirm.${price}`,
      'Book seat',
    );
    if (ok) booking.mutate(seats);
  };

  const taken = Math.max(0, ride.seatsTotal - ride.seatsAvailable);
  const facts = [
    recurrenceLabel(ride.recurrencePattern) ?? (ride.isRecurring ? 'Recurring' : null),
    durationLabel(ride.estimatedDurationMins),
    ride.distanceMiles ? `${ride.distanceMiles.toFixed(1)} mi` : null,
    luggageLabel(ride.luggageCapacity),
    genderLabel(ride.genderPreference),
    tollLabel(ride.tollPreference),
    ride.estimatedTollAmount ? `Tolls about $${ride.estimatedTollAmount.toFixed(2)}` : null,
  ].filter((f): f is string => Boolean(f));
  const total =
    ride.contributionAmount != null && ride.contributionAmount > 0
      ? `$${(ride.contributionAmount * seats).toFixed(2)} for ${seats} ${seats === 1 ? 'seat' : 'seats'}`
      : null;

  return (
    <YStack gap="$x4">
      <YStack gap="$x2">
        <XStack alignItems="center" flexWrap="wrap" gap="$x2">
          <Chip label={statusLabel(ride.status)} selected={statusIs(ride.status, 'active')} />
          {ride.isDriver ? (
            <Chip label="You drive" />
          ) : ride.isMember ? (
            <Chip label="You're on this ride" />
          ) : null}
        </XStack>
        <AppText role="heading" variant="h2">
          {ride.routeLabel}
        </AppText>
        <AppText tone="muted">Departs {formatDeparture(ride.departureAt)}</AppText>
      </YStack>

      <Card gap="$x3" variant="outlined">
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
        {!ride.isMember ? (
          <AppText tone="muted" variant="caption">
            Exact pickup details are shared with riders after they book.
          </AppText>
        ) : null}
        {facts.length > 0 ? (
          <XStack flexWrap="wrap" gap="$x2">
            {facts.map((f) => (
              <Chip key={f} label={f} />
            ))}
          </XStack>
        ) : null}
      </Card>

      <Card gap="$x3" variant="outlined">
        <XStack alignItems="center" justifyContent="space-between">
          <AppText variant="h4">Seats</AppText>
          {ride.contributionLabel ? (
            <AppText tone="primary" variant="bodyStrong">
              {ride.contributionLabel}
            </AppText>
          ) : null}
        </XStack>
        <XStack
          aria-label={`${ride.seatsAvailable} of ${ride.seatsTotal} seats open`}
          flexWrap="wrap"
          gap="$x2"
          role="img"
        >
          {Array.from({ length: ride.seatsTotal }, (_, i) => {
            const isTaken = i < taken;
            return (
              <YStack
                alignItems="center"
                backgroundColor={isTaken ? '$surfaceContainer' : '$tealTint'}
                borderColor={isTaken ? '$borderColor' : '$teal'}
                borderRadius="$control"
                borderWidth={1}
                height={44}
                justifyContent="center"
                key={i}
                width={44}
              >
                <AppIcon
                  color={isTaken ? theme.colorMuted?.val : theme.teal?.val}
                  name={isTaken ? 'user' : 'plus'}
                  size={18}
                />
              </YStack>
            );
          })}
        </XStack>
        <AppText tone="muted" variant="caption">
          {ride.seatsAvailable} of {ride.seatsTotal} {ride.seatsTotal === 1 ? 'seat' : 'seats'} open
          {taken > 0 ? ` · ${taken} taken` : ''}
        </AppText>
      </Card>

      {isWomenOnly(ride.genderPreference) && !ride.isDriver ? (
        <Card gap="$x1" variant="tinted">
          <AppText variant="bodyStrong">Women-only ride</AppText>
          <AppText tone="muted" variant="caption">
            Only riders whose gender has been verified by ManaBandhu can book this ride. If yours is
            not verified yet, booking will be refused.
          </AppText>
        </Card>
      ) : null}

      {booked != null ? (
        <Card aria-live="polite" gap="$x3" variant="tinted">
          <AppText variant="bodyStrong">Seat booked. The driver can see your booking.</AppText>
          <AppText tone="muted" variant="caption">
            You have {booked} {booked === 1 ? 'seat' : 'seats'} on this ride. Use the ride chat to
            agree on the exact pickup point.
          </AppText>
          <XStack flexWrap="wrap" gap="$x2">
            <AppButton
              label="My trips"
              onPress={() => router.push('/rides/mine?tab=trips' as Href)}
              variant="secondary"
            />
          </XStack>
        </Card>
      ) : blockReason ? (
        <Card gap="$x2" variant="tinted">
          <AppText variant="bodyStrong">{blockReason}</AppText>
          {ride.isDriver ? (
            <XStack flexWrap="wrap" gap="$x2">
              {!statusIs(ride.status, 'completed', 'cancelled') ? (
                <AppButton
                  label="Manage ride"
                  onPress={() => router.push(`/rides/${ride.id}/manage` as Href)}
                />
              ) : null}
              <AppButton
                label="Seat requests"
                onPress={() => router.push(`/rides/${ride.id}/seat-requests` as Href)}
                variant="secondary"
              />
            </XStack>
          ) : null}
        </Card>
      ) : (
        <Card gap="$x3" variant="outlined">
          <AppText variant="h4">Book a seat</AppText>
          <XStack aria-label="Number of seats" flexWrap="wrap" gap="$x2" role="radiogroup">
            {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
              <Chip
                accessibilityLabel={`${n} ${n === 1 ? 'seat' : 'seats'}`}
                key={n}
                label={String(n)}
                onPress={() => setSeats(n)}
                radio
                selected={seats === n}
              />
            ))}
          </XStack>
          {total ? (
            <AppText tone="muted" variant="caption">
              {total}, paid to the driver directly.
            </AppText>
          ) : null}
          <AppButton
            fullWidth
            icon="check"
            label={isAuthenticated ? 'Book seat' : 'Sign in to book'}
            loading={booking.isPending}
            onPress={onBook}
            size="lg"
          />
        </Card>
      )}

      {ride.isMember ? (
        <XStack flexWrap="wrap" gap="$x2">
          <AppButton
            label="Participants"
            onPress={() => router.push(`/rides/${ride.id}/participants` as Href)}
            variant="secondary"
          />
          {statusIs(ride.status, 'completed') ? (
            <AppButton
              label={ride.isDriver ? 'Rate riders' : 'Rate driver'}
              onPress={() => router.push(`/rides/${ride.id}/rate` as Href)}
              variant="secondary"
            />
          ) : null}
          {!ride.isDriver ? (
            <AppButton
              label="My trips"
              onPress={() => router.push('/rides/mine?tab=trips' as Href)}
              variant="ghost"
            />
          ) : null}
        </XStack>
      ) : null}

      <Card gap="$x2" variant="outlined">
        <XStack alignItems="center" gap="$x2">
          <AppIcon color={theme.primary?.val} name="shield" size={18} />
          <AppText variant="h4">Riding safely</AppText>
        </XStack>
        <AppText tone="muted" variant="caption">
          Meet at a public pickup point and confirm the driver before you get in.
        </AppText>
        <AppText tone="muted" variant="caption">
          Tell a trusted contact about your trip; add contacts in the Safety Center.
        </AppText>
        <AppText tone="muted" variant="caption">
          Report anything that feels wrong from the Safety Center.
        </AppText>
      </Card>
    </YStack>
  );
}
