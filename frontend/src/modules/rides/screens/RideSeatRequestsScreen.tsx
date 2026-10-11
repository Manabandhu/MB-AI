import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { getRide, listSeatRequests, updateSeatRequestStatus } from '@/modules/rides/api';
import { formatDeparture } from '@/modules/rides/components/RideListCard';
import type { RideSeatRequest } from '@/modules/rides/types';
import { confirmAction, showError } from '@/modules/rides/utils/notify';
import { errorMessage, memberLabel, statusIs, statusLabel } from '@/modules/rides/utils/rideFormat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { Screen } from '@/modules/shared/ui/Screen';

type Decision = 'accepted' | 'rejected' | 'withdrawn';

const DECISION_ERRORS: Record<Decision, string> = {
  accepted: 'Could not accept request',
  rejected: 'Could not decline request',
  withdrawn: 'Could not withdraw request',
};

/**
 * Seat requests on one ride. The driver sees every request and accepts or declines; a rider sees only their own
 * and can withdraw it. Accepting reserves seats, so the server can refuse (full, departed, inactive) and says why.
 */
export function RideSeatRequestsScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');

  const rideQuery = useQuery({
    queryKey: ['rides', 'detail', rideId],
    queryFn: () => getRide(rideId),
    enabled: Boolean(rideId) && isAuthenticated,
  });
  const query = useQuery({
    queryKey: ['rides', 'seat-requests', rideId],
    queryFn: () => listSeatRequests(rideId),
    enabled: Boolean(rideId) && isAuthenticated,
  });
  const ride = rideQuery.data;
  const isDriver = Boolean(ride?.isDriver);

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Decision }) =>
      updateSeatRequestStatus(id, status),
    onError: (e, { status }) => showError(DECISION_ERRORS[status], e),
    onSettled: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['rides', 'seat-requests', rideId] }),
        queryClient.invalidateQueries({ queryKey: ['rides', 'detail', rideId] }),
        queryClient.invalidateQueries({ queryKey: ['rides', 'participants', rideId] }),
        queryClient.invalidateQueries({ queryKey: ['rides', 'owner', rideId] }),
      ]),
  });

  const onDecline = async (request: RideSeatRequest) => {
    const ok = await confirmAction(
      'Decline this request?',
      statusIs(request.status, 'accepted')
        ? 'The rider loses their seat and is removed from the ride.'
        : 'The rider will see that you declined.',
      'Decline',
    );
    if (ok) decide.mutate({ id: request.id, status: 'rejected' });
  };

  const onWithdraw = async (request: RideSeatRequest) => {
    const ok = await confirmAction(
      'Withdraw your request?',
      statusIs(request.status, 'accepted')
        ? 'You give up the seat the driver reserved for you.'
        : 'The driver will no longer see this request.',
      'Withdraw',
    );
    if (ok) decide.mutate({ id: request.id, status: 'withdrawn' });
  };

  const body = () => {
    if (!isAuthenticated || query.isLoading || rideQuery.isLoading) {
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
    if (requests.length === 0) {
      return (
        <EmptyState
          body={
            isDriver
              ? 'Requests appear here when riders ask the driver for a seat.'
              : 'You have not requested a seat on this ride.'
          }
          iconName="user"
          title="No seat requests"
        />
      );
    }
    return (
      <YStack gap="$x3">
        {requests.map((request) => {
          const busy = decide.isPending && decide.variables?.id === request.id;
          const pending = statusIs(request.status, 'pending');
          const accepted = statusIs(request.status, 'accepted');
          return (
            <Card gap="$x2" key={request.id} variant="outlined">
              <XStack alignItems="center" gap="$x2" justifyContent="space-between">
                <AppText variant="bodyStrong">
                  {isDriver ? memberLabel(request.riderId, 'rider') : 'Your request'}
                </AppText>
                <Chip label={statusLabel(request.status)} selected={accepted} />
              </XStack>
              <AppText tone="muted" variant="caption">
                {request.seatsRequested} {request.seatsRequested === 1 ? 'seat' : 'seats'}
                {request.createdAt ? ` · sent ${formatDeparture(request.createdAt)}` : ''}
              </AppText>
              {request.message ? <AppText>“{request.message}”</AppText> : null}
              <XStack flexWrap="wrap" gap="$x2">
                {isDriver && pending ? (
                  <AppButton
                    label="Accept"
                    loading={busy && decide.variables?.status === 'accepted'}
                    onPress={() => decide.mutate({ id: request.id, status: 'accepted' })}
                  />
                ) : null}
                {isDriver && (pending || accepted) ? (
                  <AppButton
                    disabled={busy}
                    label="Decline"
                    onPress={() => onDecline(request)}
                    variant="secondary"
                  />
                ) : null}
                {!isDriver && (pending || accepted) ? (
                  <AppButton
                    disabled={busy}
                    label="Withdraw"
                    onPress={() => onWithdraw(request)}
                    variant="secondary"
                  />
                ) : null}
              </XStack>
            </Card>
          );
        })}
      </YStack>
    );
  };

  return (
    <Screen
      onRefresh={() => {
        query.refetch();
        rideQuery.refetch();
      }}
      refreshing={query.isRefetching}
    >
      <YStack gap="$x4">
        <BackButton fallback={`/rides/${rideId}`} />
        <YStack gap="$x1">
          <AppText role="heading" variant="h2">
            Seat requests
          </AppText>
          {ride ? (
            <AppText tone="muted" variant="caption">
              {ride.routeLabel} · {formatDeparture(ride.departureAt)}
            </AppText>
          ) : null}
        </YStack>
        {body()}
        {isDriver ? (
          <XStack flexWrap="wrap" gap="$x2">
            <AppButton
              label="Participants"
              onPress={() => router.push(`/rides/${rideId}/participants` as Href)}
              variant="secondary"
            />
            <AppButton
              label="Manage ride"
              onPress={() => router.push(`/rides/${rideId}/manage` as Href)}
              variant="secondary"
            />
          </XStack>
        ) : null}
      </YStack>
    </Screen>
  );
}
