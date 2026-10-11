import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { getSavedRides, unsaveRide } from '@/modules/rides/api';
import { RideListCard } from '@/modules/rides/components/RideListCard';
import { showError } from '@/modules/rides/utils/notify';
import { errorMessage } from '@/modules/rides/utils/rideFormat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Screen } from '@/modules/shared/ui/Screen';

/** Bookmarked and joined rides (`GET /rides/saved`). */
export function RideSavedScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const query = useQuery({
    queryKey: ['rides', 'saved'],
    queryFn: getSavedRides,
    enabled: isAuthenticated,
  });

  const unsave = useMutation({
    mutationFn: (rideId: string) => unsaveRide(rideId),
    onError: (e) => showError('Could not remove saved ride', e),
    onSettled: (_data, _error, rideId) =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['rides', 'saved'] }),
        queryClient.invalidateQueries({ queryKey: ['rides', 'detail', rideId] }),
      ]),
  });

  const body = () => {
    if (!isAuthenticated || query.isLoading) {
      return <LoadingState count={3} label="Loading saved rides…" variant="skeleton" />;
    }
    if (query.isError) {
      return (
        <ErrorState
          body={errorMessage(query.error)}
          onRetry={() => query.refetch()}
          retryLabel="Retry"
          title="Could not load saved rides"
        />
      );
    }
    const rides = query.data ?? [];
    if (rides.length === 0) {
      return (
        <EmptyState
          actionLabel="Browse rides"
          body="Bookmark a ride from its details page, or book a seat, and it appears here."
          iconName="bookmark"
          onAction={() => router.push('/rides/search' as Href)}
          title="No saved rides yet"
        />
      );
    }
    return (
      <YStack gap="$x3">
        {rides.map((ride) => (
          <RideListCard key={ride.id} ride={ride}>
            <AppButton
              label="View"
              onPress={() => router.push(`/rides/${ride.id}` as Href)}
              variant="secondary"
            />
            <AppButton
              label="Unsave"
              loading={unsave.isPending && unsave.variables === ride.id}
              onPress={() => unsave.mutate(ride.id)}
              variant="ghost"
            />
          </RideListCard>
        ))}
      </YStack>
    );
  };

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <YStack gap="$x4">
        <BackButton fallback="/rides" />
        <YStack gap="$x1">
          <AppText role="heading" variant="h2">
            Saved rides
          </AppText>
          <AppText tone="muted" variant="caption">
            Rides you bookmarked or joined
          </AppText>
        </YStack>
        {body()}
      </YStack>
    </Screen>
  );
}
