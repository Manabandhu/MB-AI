import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import {
  cancelBooking,
  deleteRide,
  getRideForOwner,
  listRideBookings,
  listSeatRequests,
  provisionRideChat,
  updateRideOffer,
  updateRideStatus,
} from '@/modules/rides/api';
import { RepeatTripSheet } from '@/modules/rides/components/RepeatTripSheet';
import { formatDeparture } from '@/modules/rides/components/RideListCard';
import type { RideBooking, UpdateRideOfferInput } from '@/modules/rides/types';
import { confirmAction, showError } from '@/modules/rides/utils/notify';
import {
  amountError,
  errorMessage,
  isNotFound,
  memberLabel,
  seatsError,
  statusIs,
  statusLabel,
} from '@/modules/rides/utils/rideFormat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { Screen } from '@/modules/shared/ui/Screen';
import { TextField } from '@/modules/shared/ui/TextField';

type Transition = 'in_progress' | 'completed' | 'cancelled';

const TRANSITION_COPY: Record<
  Transition,
  { title: string; body: string; confirm: string; error: string; done: string }
> = {
  in_progress: {
    title: 'Start this trip?',
    body: 'The ride leaves search and is marked in progress.',
    confirm: 'Start trip',
    error: 'Could not start the trip',
    done: 'Trip started.',
  },
  completed: {
    title: 'Mark the trip completed?',
    body: 'Riders can then rate the trip. The ride chat deletes itself 2 hours after completion. This cannot be undone.',
    confirm: 'Mark completed',
    error: 'Could not complete the trip',
    done: 'Trip completed. Riders can now rate it; the ride chat deletes itself in 2 hours.',
  },
  cancelled: {
    title: 'Cancel this ride?',
    body: 'Every booking is cancelled, open requests are declined, riders leave the ride chat, and they are notified. This cannot be undone.',
    confirm: 'Cancel ride',
    error: 'Could not cancel the ride',
    done: 'Ride cancelled. Your riders have been notified.',
  },
};

/** Driver control panel: lifecycle, seats and price, bookings, requests, chat, repeat and delete. */
export function RideManageScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');

  const rideQuery = useQuery({
    queryKey: ['rides', 'owner', rideId],
    queryFn: () => getRideForOwner(rideId),
    enabled: Boolean(rideId) && isAuthenticated,
  });
  const bookingsQuery = useQuery({
    queryKey: ['rides', 'bookings', rideId],
    queryFn: () => listRideBookings(rideId),
    enabled: Boolean(rideQuery.data),
  });
  const requestsQuery = useQuery({
    queryKey: ['rides', 'seat-requests', rideId],
    queryFn: () => listSeatRequests(rideId),
    enabled: Boolean(rideQuery.data),
  });
  const ride = rideQuery.data;

  const [seatsTotal, setSeatsTotal] = useState('');
  const [seatsAvailable, setSeatsAvailable] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [repeatOpen, setRepeatOpen] = useState(false);

  // Start the form from the stored values whenever the ride (re)loads.
  useEffect(() => {
    if (!ride) return;
    setSeatsTotal(String(ride.seatsTotal));
    setSeatsAvailable(String(ride.seatsAvailable));
    setAmount(ride.contributionAmount != null ? String(ride.contributionAmount) : '');
  }, [ride]);

  const invalidate = () =>
    Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ['rides', 'owner', rideId] }),
      queryClient.invalidateQueries({ queryKey: ['rides', 'detail', rideId] }),
      queryClient.invalidateQueries({ queryKey: ['rides', 'bookings', rideId] }),
      queryClient.invalidateQueries({ queryKey: ['rides', 'seat-requests', rideId] }),
      queryClient.invalidateQueries({ queryKey: ['rides', 'participants', rideId] }),
      queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] }),
      queryClient.invalidateQueries({ queryKey: ['rides', 'offers'] }),
    ]);

  const edit = useMutation({
    mutationFn: (input: UpdateRideOfferInput) => updateRideOffer(rideId, input),
    onSuccess: () => setNotice('Changes saved.'),
    onError: (e) => {
      setNotice(null);
      showError('Could not save changes', e);
    },
    onSettled: invalidate,
  });

  const status = useMutation({
    mutationFn: (next: Transition) => updateRideStatus(rideId, next),
    onSuccess: (_ride, next) => setNotice(TRANSITION_COPY[next].done),
    onError: (e, next) => showError(TRANSITION_COPY[next].error, e),
    onSettled: invalidate,
  });

  const removeBooking = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: () => setNotice('Booking cancelled. The seats are open again.'),
    onError: (e) => showError('Could not cancel the booking', e),
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: () => deleteRide(rideId),
    onSuccess: async () => {
      await invalidate();
      router.replace('/rides/mine' as Href);
    },
    onError: (e) => showError('Could not delete the ride', e),
  });

  const chat = useMutation({
    mutationFn: () => provisionRideChat(rideId),
    onSuccess: (res) => router.push(`/chat/${res.conversationId}` as Href),
    onError: (e) => showError('Could not open the ride chat', e),
  });

  const onTransition = async (next: Transition) => {
    const copy = TRANSITION_COPY[next];
    const destructive = next === 'cancelled';
    if (await confirmAction(copy.title, copy.body, copy.confirm, { destructive })) {
      status.mutate(next);
    }
  };

  const onSave = () => {
    if (!ride) return;
    setNotice(null);
    const next: Record<string, string | null> = {
      seatsTotal: seatsError(seatsTotal),
      seatsAvailable: null,
      amount: amount.trim() ? amountError(amount) : null,
    };
    if (!next.seatsTotal) {
      const avail = seatsAvailable.trim();
      if (!/^\d+$/.test(avail)) next.seatsAvailable = 'Use a whole number (0 or more).';
      else if (Number(avail) > Number(seatsTotal))
        next.seatsAvailable = 'Open seats cannot exceed the total.';
    }
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    const input: UpdateRideOfferInput = {};
    if (Number(seatsTotal) !== ride.seatsTotal) input.seatsTotal = Number(seatsTotal);
    if (Number(seatsAvailable) !== ride.seatsAvailable)
      input.seatsAvailable = Number(seatsAvailable);
    if (amount.trim() && Number(amount) !== ride.contributionAmount)
      input.contributionAmount = Number(amount);
    if (Object.keys(input).length === 0) {
      setNotice('Nothing changed.');
      return;
    }
    edit.mutate(input);
  };

  const onCancelBooking = async (booking: RideBooking) => {
    const ok = await confirmAction(
      'Cancel this rider’s booking?',
      'Their seats open up again and they leave the ride chat.',
      'Cancel booking',
      { destructive: true },
    );
    if (ok) removeBooking.mutate(booking.id);
  };

  const onDelete = async () => {
    const ok = await confirmAction(
      'Delete this ride?',
      'Riders are released and notified, then the ride is removed permanently.',
      'Delete',
      { destructive: true },
    );
    if (ok) remove.mutate();
  };

  const content = () => {
    if (!isAuthenticated || rideQuery.isLoading) return <LoadingState label="Loading ride…" />;
    if (rideQuery.isError || !ride) {
      if (isNotFound(rideQuery.error)) {
        return <ErrorState body="This ride no longer exists." title="Ride not found" />;
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
    const isActive = statusIs(ride.status, 'active');
    const isInProgress = statusIs(ride.status, 'in_progress');
    const finished = statusIs(ride.status, 'completed', 'cancelled');
    const busy = status.isPending;
    const pendingRequests = (requestsQuery.data ?? []).filter((r) =>
      statusIs(r.status, 'pending'),
    ).length;
    const bookings = bookingsQuery.data ?? [];

    return (
      <YStack gap="$x5">
        <Card gap="$x3" variant="outlined">
          <XStack alignItems="center" gap="$x2" justifyContent="space-between">
            <AppText variant="h4">Trip status</AppText>
            <Chip label={statusLabel(ride.status)} selected={isActive || isInProgress} />
          </XStack>
          <AppText tone="muted" variant="caption">
            Departs {formatDeparture(ride.departureAt)} · {ride.seatsAvailable} of {ride.seatsTotal}{' '}
            seats open
          </AppText>
          {finished ? (
            <AppText tone="muted">
              {statusIs(ride.status, 'completed')
                ? 'This trip is completed. It can no longer be edited; repeat it to post it again.'
                : 'This ride was cancelled. It can no longer be edited; repeat it to post it again.'}
            </AppText>
          ) : (
            <XStack flexWrap="wrap" gap="$x2">
              {isActive ? (
                <AppButton
                  disabled={busy}
                  icon="car"
                  label="Start trip"
                  loading={busy && status.variables === 'in_progress'}
                  onPress={() => onTransition('in_progress')}
                />
              ) : null}
              <AppButton
                disabled={busy}
                icon="check"
                label="Mark completed"
                loading={busy && status.variables === 'completed'}
                onPress={() => onTransition('completed')}
                variant={isInProgress ? 'primary' : 'secondary'}
              />
              <AppButton
                disabled={busy}
                label="Cancel ride"
                loading={busy && status.variables === 'cancelled'}
                onPress={() => onTransition('cancelled')}
                variant="danger"
              />
            </XStack>
          )}
        </Card>

        <YStack gap="$x3">
          <XStack alignItems="center" gap="$x2" justifyContent="space-between">
            <AppText role="heading" variant="h4">
              Bookings
            </AppText>
            <AppButton
              label={pendingRequests ? `Seat requests (${pendingRequests})` : 'Seat requests'}
              onPress={() => router.push(`/rides/${rideId}/seat-requests` as Href)}
              variant="secondary"
            />
          </XStack>
          {bookingsQuery.isLoading ? (
            <LoadingState label="Loading bookings…" />
          ) : bookingsQuery.isError ? (
            <ErrorState
              body={errorMessage(bookingsQuery.error)}
              compact
              onRetry={() => bookingsQuery.refetch()}
              retryLabel="Retry"
              title="Could not load bookings"
            />
          ) : bookings.length === 0 ? (
            <EmptyState
              body="Riders who book a seat appear here."
              compact
              iconName="user"
              title="No bookings yet"
            />
          ) : (
            bookings.map((b) => (
              <Card gap="$x2" key={b.id} variant="outlined">
                <XStack alignItems="center" gap="$x2" justifyContent="space-between">
                  <AppText variant="bodyStrong">{memberLabel(b.userId, 'rider')}</AppText>
                  <Chip label={statusLabel(b.status)} selected={statusIs(b.status, 'confirmed')} />
                </XStack>
                <AppText tone="muted" variant="caption">
                  {b.seatsBooked} {b.seatsBooked === 1 ? 'seat' : 'seats'}
                  {b.createdAt ? ` · booked ${formatDeparture(b.createdAt)}` : ''}
                </AppText>
                {!finished && !statusIs(b.status, 'cancelled') ? (
                  <XStack>
                    <AppButton
                      label="Cancel booking"
                      loading={removeBooking.isPending && removeBooking.variables === b.id}
                      onPress={() => onCancelBooking(b)}
                      variant="secondary"
                    />
                  </XStack>
                ) : null}
              </Card>
            ))
          )}
        </YStack>

        {!finished ? (
          <YStack gap="$x3">
            <AppText role="heading" variant="h4">
              Seats and price
            </AppText>
            <TextField
              error={errors.seatsTotal}
              helper="1 to 8. Cannot go below the seats riders already hold."
              keyboardType="number-pad"
              label="Total seats"
              onChangeText={setSeatsTotal}
              value={seatsTotal}
            />
            <TextField
              error={errors.seatsAvailable}
              helper="Seats still open for booking."
              keyboardType="number-pad"
              label="Open seats"
              onChangeText={setSeatsAvailable}
              value={seatsAvailable}
            />
            <TextField
              error={errors.amount}
              helper="Dollars per seat; 0 means free."
              keyboardType="decimal-pad"
              label="Contribution per seat ($)"
              onChangeText={setAmount}
              placeholder="Not set"
              value={amount}
            />
            <XStack>
              <AppButton label="Save changes" loading={edit.isPending} onPress={onSave} />
            </XStack>
          </YStack>
        ) : null}

        <XStack flexWrap="wrap" gap="$x2">
          <AppButton
            icon="message"
            label="Ride chat"
            loading={chat.isPending}
            onPress={() => chat.mutate()}
            variant="secondary"
          />
          <AppButton
            label="Participants"
            onPress={() => router.push(`/rides/${rideId}/participants` as Href)}
            variant="secondary"
          />
          <AppButton
            icon="refresh"
            label="Repeat trip"
            onPress={() => setRepeatOpen(true)}
            variant="secondary"
          />
          <AppButton
            label="View ride"
            onPress={() => router.push(`/rides/${rideId}` as Href)}
            variant="ghost"
          />
          <AppButton
            label="Delete ride"
            loading={remove.isPending}
            onPress={onDelete}
            variant="danger"
          />
        </XStack>
      </YStack>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Screen
        onRefresh={() => {
          rideQuery.refetch();
          bookingsQuery.refetch();
          requestsQuery.refetch();
        }}
        refreshing={rideQuery.isRefetching}
      >
        <YStack gap="$x4">
          <BackButton fallback="/rides/mine" />
          <YStack gap="$x1">
            <AppText role="heading" variant="h2">
              Manage ride
            </AppText>
            {ride ? (
              <AppText tone="muted" variant="caption">
                {ride.routeLabel}
              </AppText>
            ) : null}
          </YStack>
          {notice ? (
            <Card aria-live="polite" variant="tinted">
              <AppText variant="label">{notice}</AppText>
            </Card>
          ) : null}
          {content()}
        </YStack>
      </Screen>
      <RepeatTripSheet
        onClose={() => setRepeatOpen(false)}
        onPosted={(newRide) => {
          setRepeatOpen(false);
          router.push(`/rides/${newRide.id}/manage` as Href);
        }}
        ride={repeatOpen ? (ride ?? null) : null}
      />
    </KeyboardAvoidingView>
  );
}
