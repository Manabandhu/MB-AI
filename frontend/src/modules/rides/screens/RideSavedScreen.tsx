import { type Href, useRouter } from 'expo-router';
import { RideCard } from '@/modules/rides/components/RideCard';
import { useSavedRides } from '@/modules/rides/hooks/useSavedRides';
import { errorMessage } from '@/modules/rides/utils/rideFormat';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';

/**
 * Bookmarked and joined rides (`GET /rides/saved`). Cards open the ride; the heart removes a bookmark. Rides the
 * viewer rides on are labelled "Joined" with no heart (the server keeps them listed while the seat is held).
 */
export function RideSavedScreen() {
  const router = useRouter();
  const saved = useSavedRides();
  const query = saved.query;

  const body = () => {
    if (query.isLoading || query.isPending) {
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
          body="Tap the heart on a ride, or book a seat, and it appears here."
          iconName="heart"
          onAction={() => router.push('/rides/search' as Href)}
          title="No saved rides yet"
        />
      );
    }
    return (
      <ResponsiveGrid>
        {rides.map((ride) => (
          <RideCard
            key={ride.id}
            onToggleSave={() => saved.toggle(ride.id)}
            ride={ride}
            saved={saved.isSaved(ride.id)}
            saving={saved.pendingId === ride.id}
            showStatus
          />
        ))}
      </ResponsiveGrid>
    );
  };

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <ScreenHeader
        back={{ fallback: '/rides' as Href }}
        subtitle="Rides you saved or joined"
        title="Saved rides"
      />
      {body()}
    </Screen>
  );
}
