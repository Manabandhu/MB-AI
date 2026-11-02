import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { getFavorites } from '@/modules/rooms/api';
import { RoomCard } from '@/modules/rooms/components/RoomCard';
import { useRoomSave } from '@/modules/rooms/hooks/useRoomSave';
import { errorMessage } from '@/modules/rooms/utils/roomLabels';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';

/** The caller's saved rooms, straight from the server (`GET /favorites`). */
export function RoomFavoritesScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const { isSaved, toggle } = useRoomSave();

  const favoritesQuery = useQuery({
    queryKey: ['rooms', 'favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated,
  });

  // Hide rooms the person just unsaved while the request and refetch run.
  const rooms = (favoritesQuery.data ?? []).filter((room) =>
    isSaved({ id: room.id, savedByViewer: true }),
  );

  const body = () => {
    if (!isAuthenticated || favoritesQuery.isLoading) {
      return <LoadingState count={3} label="Loading saved rooms…" variant="skeleton" />;
    }
    if (favoritesQuery.isError) {
      return (
        <ErrorState
          body={errorMessage(favoritesQuery.error)}
          onRetry={() => favoritesQuery.refetch()}
          retryLabel="Retry"
          title="Could not load saved rooms"
        />
      );
    }
    if (rooms.length === 0) {
      return (
        <EmptyState
          actionLabel="Browse rooms"
          body="Tap the heart on a listing to keep it here and compare rent, amenities, and location."
          iconName="heart"
          onAction={() => router.push('/rooms' as Href)}
          title="No saved rooms yet"
        />
      );
    }
    return (
      <ResponsiveGrid gap={16}>
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            onToggleSave={() => toggle({ id: room.id, savedByViewer: true })}
            room={room}
            saved={isSaved({ ...room, savedByViewer: true })}
          />
        ))}
      </ResponsiveGrid>
    );
  };

  return (
    <Screen onRefresh={() => favoritesQuery.refetch()} refreshing={favoritesQuery.isRefetching}>
      <YStack gap="$x4">
        <ScreenHeader
          back={{ fallback: '/rooms' as Href }}
          subtitle={
            favoritesQuery.data ? `${rooms.length} saved` : 'Compare the rooms you shortlisted'
          }
          title="Saved rooms"
        />
        {body()}
      </YStack>
    </Screen>
  );
}
