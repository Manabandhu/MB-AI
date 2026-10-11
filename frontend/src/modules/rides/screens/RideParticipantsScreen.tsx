import { useQuery } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { getRide, listParticipants } from '@/modules/rides/api';
import { formatDeparture } from '@/modules/rides/components/RideListCard';
import { errorMessage, memberLabel, statusIs } from '@/modules/rides/utils/rideFormat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Avatar } from '@/modules/shared/ui/Avatar';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { Screen } from '@/modules/shared/ui/Screen';

/** Who is on the ride (members only: driver, passengers, admins). */
export function RideParticipantsScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');

  const rideQuery = useQuery({
    queryKey: ['rides', 'detail', rideId],
    queryFn: () => getRide(rideId),
    enabled: Boolean(rideId) && isAuthenticated,
  });
  const query = useQuery({
    queryKey: ['rides', 'participants', rideId],
    queryFn: () => listParticipants(rideId),
    enabled: Boolean(rideId) && isAuthenticated,
  });
  const ride = rideQuery.data;

  const body = () => {
    if (!isAuthenticated || query.isLoading) {
      return <LoadingState count={3} label="Loading participants…" variant="skeleton" />;
    }
    if (query.isError) {
      return (
        <ErrorState
          body={errorMessage(query.error)}
          onRetry={() => query.refetch()}
          retryLabel="Retry"
          title="Could not load participants"
        />
      );
    }
    const people = query.data ?? [];
    if (people.length === 0) {
      return (
        <EmptyState
          body="Riders appear here once they book a seat or the driver accepts their request."
          iconName="community"
          title="No participants yet"
        />
      );
    }
    return (
      <YStack gap="$x3">
        {people.map((p) => {
          const name = p.userId === userId ? 'You' : memberLabel(p.userId, p.role);
          return (
            <Card alignItems="center" flexDirection="row" gap="$x3" key={p.id} variant="outlined">
              <Avatar name={name} size="md" />
              <YStack flex={1} gap={2}>
                <AppText variant="bodyStrong">{name}</AppText>
                <AppText tone="muted" variant="caption">
                  {p.joinedAt ? `Joined ${formatDeparture(p.joinedAt)}` : 'On this ride'}
                </AppText>
              </YStack>
              <Chip
                label={statusIs(p.role, 'driver') ? 'Driver' : 'Rider'}
                selected={statusIs(p.role, 'driver')}
              />
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
            Participants
          </AppText>
          {ride ? (
            <AppText tone="muted" variant="caption">
              {ride.routeLabel} · {formatDeparture(ride.departureAt)}
            </AppText>
          ) : null}
        </YStack>
        {body()}
        {ride?.isDriver ? (
          <XStack flexWrap="wrap" gap="$x2">
            <AppButton
              label="Seat requests"
              onPress={() => router.push(`/rides/${rideId}/seat-requests` as Href)}
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
