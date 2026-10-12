import { type UseQueryResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { shareLink } from '@/lib/share';
import {
  cancelBooking,
  deleteRide,
  getRideForOwner,
  listParticipants,
  listRideBookings,
  listSeatRequests,
  provisionRideChat,
  updateRideOffer,
  updateRideStatus,
  updateSeatRequestStatus,
} from '@/modules/rides/api';
import { InlineNotice } from '@/modules/rides/components/InlineNotice';
import { RepeatTripSheet } from '@/modules/rides/components/RepeatTripSheet';
import { formatDeparture, seatsText } from '@/modules/rides/components/RideCard';
import { useTimedNotice } from '@/modules/rides/hooks/useTimedNotice';
import type { Ride, RideBooking, RideSeatRequest } from '@/modules/rides/types';
import { showError, showMessage } from '@/modules/rides/utils/notify';
import {
  amountError,
  errorMessage,
  heldSeats,
  isForbidden,
  isNotFound,
  memberLabel,
  statusIs,
  statusLabel,
  statusTone,
} from '@/modules/rides/utils/rideFormat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { useConfirm } from '@/modules/shared/ui/ConfirmSheet';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { NumberStepper } from '@/modules/shared/ui/NumberStepper';
import { PersonRow } from '@/modules/shared/ui/PersonRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';
import { TextField } from '@/modules/shared/ui/TextField';

type Tab = 'overview' | 'requests' | 'riders';
type Transition = 'in_progress' | 'completed' | 'cancelled';

const MAX_SEATS = 8;

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

const toTab = (v: string | undefined): Tab => (v === 'requests' || v === 'riders' ? v : 'overview');

/**
 * The driver's hub for one ride: Overview (status, seats and price, repeat, danger zone), Requests (accept or
 * decline) and Riders (bookings and everyone on the ride). `?tab=requests|riders` opens a tab; the old
 * `/seat-requests` and `/participants` routes redirect here. Anyone but the driver is sent to the ride page.
 */
export function RideManageScreen() {
  const params = useLocalSearchParams<{ rideId: string; tab?: string }>();
  const rideId = params.rideId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const [tab, setTab] = useState<Tab>(toTab(params.tab));

  useEffect(() => {
    setTab(toTab(params.tab));
  }, [params.tab]);

  const rideQuery = useQuery({
    queryKey: ['rides', 'owner', rideId],
    queryFn: () => getRideForOwner(rideId),
    enabled: Boolean(rideId) && isAuthenticated,
    // 403 (not the driver) and 404 are answers, not glitches; retrying only delays the redirect or message.
    retry: (count, error) => !isForbidden(error) && !isNotFound(error) && count < 2,
  });
  const ride = rideQuery.data;
  const requestsQuery = useQuery({
    queryKey: ['rides', 'seat-requests', rideId],
    queryFn: () => listSeatRequests(rideId),
    enabled: Boolean(ride),
  });

  // Riders following an old link (or a notification) see their own seat on the ride page instead.
  useEffect(() => {
    if (isForbidden(rideQuery.error)) router.replace(`/rides/${rideId}` as Href);
  }, [rideQuery.error, rideId, router]);

  const chat = useMutation({
    mutationFn: () => provisionRideChat(rideId),
    onSuccess: (res) => router.push(`/chat/${res.conversationId}` as Href),
    onError: (e) => showError('Could not open the ride chat', e),
  });

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

  const changeTab = (next: Tab) => {
    setTab(next);
    router.setParams({ tab: next === 'overview' ? undefined : next });
  };

  const pendingCount = (requestsQuery.data ?? []).filter((r) =>
    statusIs(r.status, 'pending'),
  ).length;

  const body = () => {
    if (!isAuthenticated || rideQuery.isLoading || isForbidden(rideQuery.error)) {
      return <LoadingState count={3} label="Loading ride…" variant="skeleton" />;
    }
    if (rideQuery.isError || !ride) {
      if (isNotFound(rideQuery.error)) {
        return (
          <ErrorState
            actionIcon={null}
            body="This ride no longer exists."
            onRetry={() => router.replace('/rides/mine' as Href)}
            retryLabel="My rides"
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
    return (
      <YStack gap="$x4">
        <SegmentedControl
          label="Manage sections"
          onChange={changeTab}
          options={[
            { value: 'overview', label: 'Overview' },
            {
              value: 'requests',
              label: 'Requests',
              count: requestsQuery.isSuccess ? pendingCount : undefined,
            },
            { value: 'riders', label: 'Riders' },
          ]}
          value={tab}
        />
        {tab === 'overview' ? <OverviewTab ride={ride} /> : null}
        {tab === 'requests' ? <RequestsTab query={requestsQuery} ride={ride} /> : null}
        {tab === 'riders' ? <RidersTab ride={ride} /> : null}
      </YStack>
    );
  };

  return (
    <Screen
      keyboardAvoiding
      onRefresh={() => {
        rideQuery.refetch();
        requestsQuery.refetch();
        // The Riders tab's queries; refetching only refreshes the ones that are mounted.
        queryClient.refetchQueries({ queryKey: ['rides', 'bookings', rideId] });
        queryClient.refetchQueries({ queryKey: ['rides', 'participants', rideId] });
      }}
      refreshing={rideQuery.isRefetching}
    >
      <ScreenHeader
        actions={
          ride ? (
            <>
              <IconButton icon="message" label="Open ride chat" onPress={() => chat.mutate()} />
              <IconButton
                icon="eye"
                label="View ride page"
                onPress={() => router.push(`/rides/${rideId}` as Href)}
              />
              <IconButton icon="share" label="Share ride" onPress={onShare} />
            </>
          ) : undefined
        }
        back={{ fallback: '/rides/mine' as Href }}
        subtitle={ride ? `${ride.routeLabel} · ${formatDeparture(ride.departureAt)}` : null}
        title="Manage ride"
      />
      {body()}
    </Screen>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────────────────────────────────────────

function OverviewTab({ ride }: { ride: Ride }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const notices = useTimedNotice();
  const held = heldSeats(ride);
  const [seatsTotal, setSeatsTotal] = useState(ride.seatsTotal);
  const [amount, setAmount] = useState('');
  const [amountProblem, setAmountProblem] = useState<string | null>(null);
  const [repeatOpen, setRepeatOpen] = useState(false);

  // Start the form from the stored values whenever the ride (re)loads.
  useEffect(() => {
    setSeatsTotal(ride.seatsTotal);
    setAmount(ride.contributionAmount != null ? String(ride.contributionAmount) : '');
  }, [ride]);

  const refreshAll = () => queryClient.invalidateQueries({ queryKey: ['rides'] });

  const edit = useMutation({
    mutationFn: (input: { seatsTotal?: number; contributionAmount?: number }) =>
      updateRideOffer(ride.id, input),
    onSuccess: () => notices.show({ anchor: 'edit', text: 'Changes saved.' }),
    onError: (e) => showError('Could not save changes', e),
    onSettled: refreshAll,
  });

  const status = useMutation({
    mutationFn: (next: Transition) => updateRideStatus(ride.id, next),
    onSuccess: (_ride, next) =>
      notices.show({
        anchor: next === 'cancelled' ? 'danger' : 'status',
        text: TRANSITION_COPY[next].done,
      }),
    onError: (e, next) => showError(TRANSITION_COPY[next].error, e),
    onSettled: refreshAll,
  });

  const remove = useMutation({
    mutationFn: () => deleteRide(ride.id),
    onSuccess: () => {
      // Leave first so nothing refetches the deleted ride, then drop it and refresh the lists in the background.
      router.replace('/rides/mine' as Href);
      queryClient.removeQueries({ queryKey: ['rides', 'owner', ride.id] });
      refreshAll();
    },
    onError: (e) => showError('Could not delete the ride', e),
  });

  const onTransition = async (next: Transition) => {
    const copy = TRANSITION_COPY[next];
    const ok = await confirm({
      title: copy.title,
      body: copy.body,
      confirmLabel: copy.confirm,
      cancelLabel: next === 'cancelled' ? 'Keep ride' : 'Not now',
      destructive: next === 'cancelled',
    });
    if (ok) status.mutate(next);
  };

  const onDelete = async () => {
    const ok = await confirm({
      title: 'Delete this ride?',
      body: 'Riders are released and notified, then the ride is removed permanently.',
      confirmLabel: 'Delete ride',
      cancelLabel: 'Keep ride',
      destructive: true,
    });
    if (ok) remove.mutate();
  };

  const onSave = () => {
    const problem = amount.trim() ? amountError(amount) : null;
    setAmountProblem(problem);
    if (problem) return;
    // Only the total is sent: the server derives open seats under the row lock and refuses (409/400) a total
    // below what riders hold, which `showError` reports.
    const input: { seatsTotal?: number; contributionAmount?: number } = {};
    if (seatsTotal !== ride.seatsTotal) input.seatsTotal = seatsTotal;
    if (amount.trim() && Number(amount) !== ride.contributionAmount) {
      input.contributionAmount = Number(amount);
    }
    if (Object.keys(input).length === 0) {
      notices.show({ anchor: 'edit', text: 'Nothing changed.' });
      return;
    }
    edit.mutate(input);
  };

  const isActive = statusIs(ride.status, 'active');
  const isInProgress = statusIs(ride.status, 'in_progress');
  const completed = statusIs(ride.status, 'completed');
  const finished = statusIs(ride.status, 'completed', 'cancelled');
  const busy = status.isPending;

  return (
    <YStack gap="$x5">
      <Card gap="$x3" variant="outlined">
        <XStack alignItems="center" gap="$x2" justifyContent="space-between">
          <Heading variant="h4">Trip status</Heading>
          <StatusBadge label={statusLabel(ride.status)} tone={statusTone(ride.status)} />
        </XStack>
        <AppText tone="muted" variant="caption">
          Departs {formatDeparture(ride.departureAt)} · {seatsText(ride)}
          {ride.contributionLabel ? ` · ${ride.contributionLabel}` : ''}
        </AppText>
        {finished ? (
          <AppText tone="muted">
            {completed
              ? 'This trip is completed. It can no longer be edited; repeat it to post it again.'
              : 'This ride was cancelled. It can no longer be edited; repeat it to post it again.'}
          </AppText>
        ) : null}
        <XStack flexWrap="wrap" gap="$x2">
          {isActive ? (
            <AppButton
              disabled={busy}
              icon="car"
              label="Start trip"
              loading={busy && status.variables === 'in_progress'}
              onPress={() => onTransition('in_progress')}
              size="sm"
            />
          ) : null}
          {isActive || isInProgress ? (
            <AppButton
              disabled={busy}
              icon="check"
              label="Mark completed"
              loading={busy && status.variables === 'completed'}
              onPress={() => onTransition('completed')}
              size="sm"
              variant={isInProgress ? 'primary' : 'secondary'}
            />
          ) : null}
          {completed ? (
            <AppButton
              icon="star"
              label="Rate riders"
              onPress={() => router.push(`/rides/${ride.id}/rate` as Href)}
              size="sm"
            />
          ) : null}
          <AppButton
            icon="repeat"
            label="Repeat trip"
            onPress={() => setRepeatOpen(true)}
            size="sm"
            variant="secondary"
          />
        </XStack>
        <InlineNotice notice={notices.at('status') ?? notices.at('repeat')} />
      </Card>

      {!finished ? (
        <Card gap="$x3" variant="outlined">
          <Heading variant="h4">Seats and price</Heading>
          <NumberStepper
            helper={
              held > 0
                ? `${held} ${held === 1 ? 'seat' : 'seats'} not open (held by riders or blocked).`
                : `${seatsTotal} open after saving.`
            }
            label="Total seats"
            max={MAX_SEATS}
            min={Math.max(1, held)}
            onChange={setSeatsTotal}
            value={seatsTotal}
          />
          <TextField
            error={amountProblem}
            helper="Dollars per seat; 0 means free."
            keyboardType="decimal-pad"
            label="Contribution per seat ($)"
            onChangeText={(t) => {
              setAmount(t);
              setAmountProblem(null);
            }}
            placeholder="Not set"
            value={amount}
          />
          <XStack alignItems="center" flexWrap="wrap" gap="$x3">
            <AppButton label="Save changes" loading={edit.isPending} onPress={onSave} size="sm" />
            <InlineNotice notice={notices.at('edit')} />
          </XStack>
        </Card>
      ) : null}

      <YStack borderColor="$error" borderRadius="$card" borderWidth={1} gap="$x3" padding="$x4">
        <Heading variant="h4">Danger zone</Heading>
        {!finished ? (
          <YStack gap="$x2">
            <AppText variant="bodyStrong">Cancel ride</AppText>
            <AppText tone="muted" variant="caption">
              Keeps the ride in your history. Every booking is cancelled, open requests are
              declined, and riders are notified and leave the ride chat.
            </AppText>
            <XStack>
              <AppButton
                disabled={busy}
                label="Cancel ride"
                loading={busy && status.variables === 'cancelled'}
                onPress={() => onTransition('cancelled')}
                size="sm"
                variant="danger"
              />
            </XStack>
          </YStack>
        ) : null}
        <YStack gap="$x2">
          <AppText variant="bodyStrong">Delete ride</AppText>
          <AppText tone="muted" variant="caption">
            Removes the ride for good, including from history. Riders are released and notified
            first.
          </AppText>
          <XStack>
            <AppButton
              label="Delete ride"
              loading={remove.isPending}
              onPress={onDelete}
              size="sm"
              variant="danger"
            />
          </XStack>
        </YStack>
        <InlineNotice notice={notices.at('danger')} />
      </YStack>

      <RepeatTripSheet
        onClose={() => setRepeatOpen(false)}
        onPosted={(newRide) => {
          setRepeatOpen(false);
          notices.show({
            anchor: 'repeat',
            text: 'Repeat trip posted. Riders can book it now.',
            href: `/rides/${newRide.id}/manage`,
            hrefLabel: 'Manage new ride',
          });
        }}
        ride={repeatOpen ? ride : null}
      />
    </YStack>
  );
}

// ─── Requests ─────────────────────────────────────────────────────────────────────────────────────────────────────

function RequestsTab({ ride, query }: { ride: Ride; query: UseQueryResult<RideSeatRequest[]> }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const notices = useTimedNotice();

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) =>
      updateSeatRequestStatus(id, status),
    onSuccess: (_r, { status }) =>
      notices.show({
        anchor: 'requests',
        text:
          status === 'accepted'
            ? 'Request accepted. The rider is on the ride and in the chat.'
            : 'Request declined.',
      }),
    onError: (e, { status }) =>
      showError(
        status === 'accepted' ? 'Could not accept request' : 'Could not decline request',
        e,
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['rides'] }),
  });

  const onAccept = async (request: RideSeatRequest) => {
    const ok = await confirm({
      title: 'Accept this request?',
      body: `${request.seatsRequested} ${request.seatsRequested === 1 ? 'seat is' : 'seats are'} reserved for the rider and they join the ride chat.`,
      confirmLabel: 'Accept',
    });
    if (ok) decide.mutate({ id: request.id, status: 'accepted' });
  };

  const onDecline = async (request: RideSeatRequest) => {
    const accepted = statusIs(request.status, 'accepted');
    const ok = await confirm({
      title: 'Decline this request?',
      body: accepted
        ? 'The rider loses their seat and is removed from the ride.'
        : 'The rider will see that you declined.',
      confirmLabel: 'Decline',
      // Declining an accepted request removes the rider from the ride.
      destructive: accepted,
    });
    if (ok) decide.mutate({ id: request.id, status: 'rejected' });
  };

  if (query.isLoading) {
    return <LoadingState count={3} label="Loading seat requests…" variant="skeleton" />;
  }
  if (query.isError) {
    return (
      <ErrorState
        body={errorMessage(query.error)}
        onRetry={() => query.refetch()}
        retryLabel="Retry"
        title="Could not load seat requests"
      />
    );
  }
  const requests = query.data ?? [];
  const finished = statusIs(ride.status, 'completed', 'cancelled');
  return (
    <YStack gap="$x3">
      <InlineNotice notice={notices.at('requests')} />
      {requests.length === 0 ? (
        <EmptyState
          body="Riders usually book instantly from the ride page, so most rides have no requests. Any seat request a rider sends appears here."
          iconName="user"
          title="No seat requests"
        />
      ) : (
        requests.map((request) => {
          const busy = decide.isPending && decide.variables?.id === request.id;
          const pending = statusIs(request.status, 'pending');
          const accepted = statusIs(request.status, 'accepted');
          const subtitle = [
            `${request.seatsRequested} ${request.seatsRequested === 1 ? 'seat' : 'seats'}`,
            request.createdAt ? `sent ${formatDeparture(request.createdAt)}` : null,
          ]
            .filter(Boolean)
            .join(' · ');
          return (
            <PersonRow
              actions={
                finished ? undefined : (
                  <>
                    {pending ? (
                      <AppButton
                        disabled={busy}
                        label="Accept"
                        loading={busy && decide.variables?.status === 'accepted'}
                        onPress={() => onAccept(request)}
                        size="sm"
                      />
                    ) : null}
                    {pending || accepted ? (
                      <AppButton
                        disabled={busy}
                        label="Decline"
                        loading={busy && decide.variables?.status === 'rejected'}
                        onPress={() => onDecline(request)}
                        size="sm"
                        variant="secondary"
                      />
                    ) : null}
                  </>
                )
              }
              badge={
                <StatusBadge
                  label={statusLabel(request.status)}
                  tone={statusTone(request.status)}
                />
              }
              detail={
                request.message ? (
                  <AppText tone="muted" variant="caption">{`“${request.message}”`}</AppText>
                ) : null
              }
              key={request.id}
              name={memberLabel(request.riderId, 'rider')}
              subtitle={subtitle}
            />
          );
        })
      )}
    </YStack>
  );
}

// ─── Riders ───────────────────────────────────────────────────────────────────────────────────────────────────────

function RidersTab({ ride }: { ride: Ride }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const notices = useTimedNotice();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [showCancelled, setShowCancelled] = useState(false);

  const bookingsQuery = useQuery({
    queryKey: ['rides', 'bookings', ride.id],
    queryFn: () => listRideBookings(ride.id),
  });
  const participantsQuery = useQuery({
    queryKey: ['rides', 'participants', ride.id],
    queryFn: () => listParticipants(ride.id),
  });

  const removeBooking = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: () =>
      notices.show({ anchor: 'bookings', text: 'Booking cancelled. The seats are open again.' }),
    onError: (e) => showError('Could not cancel the booking', e),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['rides'] }),
  });

  const onCancelBooking = async (booking: RideBooking) => {
    const ok = await confirm({
      title: 'Cancel this rider’s booking?',
      body: 'Their seats open up again and they leave the ride chat. They are notified.',
      confirmLabel: 'Cancel booking',
      cancelLabel: 'Keep booking',
      destructive: true,
    });
    if (ok) removeBooking.mutate(booking.id);
  };

  const finished = statusIs(ride.status, 'completed', 'cancelled');
  const bookings = bookingsQuery.data ?? [];
  const live = bookings.filter((b) => !statusIs(b.status, 'cancelled'));
  const cancelled = bookings.filter((b) => statusIs(b.status, 'cancelled'));
  const people = participantsQuery.data ?? [];

  const bookingRow = (b: RideBooking) => (
    <PersonRow
      actions={
        !finished && !statusIs(b.status, 'cancelled') ? (
          <AppButton
            label="Cancel"
            loading={removeBooking.isPending && removeBooking.variables === b.id}
            onPress={() => onCancelBooking(b)}
            size="sm"
            variant="secondary"
          />
        ) : undefined
      }
      badge={<StatusBadge label={statusLabel(b.status)} tone={statusTone(b.status)} />}
      key={b.id}
      name={memberLabel(b.userId, 'rider')}
      subtitle={`${b.seatsBooked} ${b.seatsBooked === 1 ? 'seat' : 'seats'}${b.createdAt ? ` · booked ${formatDeparture(b.createdAt)}` : ''}`}
    />
  );

  return (
    <YStack gap="$x5">
      <YStack gap="$x3">
        <Heading variant="h4">Bookings</Heading>
        <InlineNotice notice={notices.at('bookings')} />
        {bookingsQuery.isLoading ? (
          <LoadingState count={2} label="Loading bookings…" variant="skeleton" />
        ) : bookingsQuery.isError ? (
          <ErrorState
            body={errorMessage(bookingsQuery.error)}
            compact
            onRetry={() => bookingsQuery.refetch()}
            retryLabel="Retry"
            title="Could not load bookings"
          />
        ) : live.length === 0 && cancelled.length === 0 ? (
          <EmptyState
            body="Riders who book a seat appear here."
            compact
            iconName="user"
            title="No bookings yet"
          />
        ) : (
          <>
            {live.length === 0 ? (
              <AppText tone="muted" variant="caption">
                No live bookings.
              </AppText>
            ) : (
              live.map(bookingRow)
            )}
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
            {showCancelled ? cancelled.map(bookingRow) : null}
          </>
        )}
      </YStack>

      <YStack gap="$x3">
        <Heading variant="h4">On this ride</Heading>
        {participantsQuery.isLoading ? (
          <LoadingState count={2} label="Loading riders…" variant="skeleton" />
        ) : participantsQuery.isError ? (
          <ErrorState
            body={errorMessage(participantsQuery.error)}
            compact
            onRetry={() => participantsQuery.refetch()}
            retryLabel="Retry"
            title="Could not load riders"
          />
        ) : people.length === 0 ? (
          <AppText tone="muted" variant="caption">
            Riders appear here once they book a seat or you accept their request.
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
    </YStack>
  );
}
