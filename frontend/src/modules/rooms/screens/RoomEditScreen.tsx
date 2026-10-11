import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/lib/authStore';
import { getRoomForOwner } from '@/modules/rooms/api';
import { RoomForm } from '@/modules/rooms/components/RoomForm';
import { errorMessage, isNotFound } from '@/modules/rooms/utils/roomLabels';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Screen } from '@/modules/shared/ui/Screen';

/** Loads the owner view of a listing (exact address, amenities) and renders the shared form in edit mode. */
export function RoomEditScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['rooms', 'owner', roomId],
    queryFn: () => getRoomForOwner(roomId),
    enabled: Boolean(roomId) && isAuthenticated,
  });

  if (!isAuthenticated || isLoading) {
    return (
      <Screen>
        <LoadingState label="Loading listing…" />
      </Screen>
    );
  }

  if (isError || !data) {
    const notFound = isNotFound(error);
    return (
      <Screen>
        <BackButton fallback="/rooms/my-listings" />
        <ErrorState
          body={
            notFound ? 'This listing was removed or is not yours to edit.' : errorMessage(error)
          }
          onRetry={notFound ? undefined : () => refetch()}
          retryLabel="Retry"
          title={notFound ? 'Room not found' : 'Could not load listing'}
        />
      </Screen>
    );
  }

  return <RoomForm initial={data} key={data.id} mode="edit" />;
}
