import { formatMoney } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Image } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { getFavorites } from '@/modules/rooms/api';
import { useRoomSave } from '@/modules/rooms/hooks/useRoomSave';
import type { RoomListing } from '@/modules/rooms/types';
import { errorMessage } from '@/modules/rooms/utils/roomLabels';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { Screen } from '@/modules/shared/ui/Screen';

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
      <YStack gap="$x3">
        {rooms.map((room) => (
          <SavedRoomCard
            key={room.id}
            onOpen={() => router.push(`/rooms/${room.id}` as Href)}
            onUnsave={() => toggle({ id: room.id, savedByViewer: true })}
            room={room}
          />
        ))}
      </YStack>
    );
  };

  return (
    <Screen onRefresh={() => favoritesQuery.refetch()} refreshing={favoritesQuery.isRefetching}>
      <YStack gap="$x4">
        <BackButton fallback="/rooms" />
        <YStack gap={2}>
          <AppText role="heading" variant="h2">
            Saved rooms
          </AppText>
          <AppText tone="muted" variant="caption">
            {favoritesQuery.data ? `${rooms.length} saved` : 'Compare the rooms you shortlisted'}
          </AppText>
        </YStack>
        {body()}
      </YStack>
    </Screen>
  );
}

function SavedRoomCard({
  room,
  onOpen,
  onUnsave,
}: {
  room: RoomListing;
  onOpen: () => void;
  onUnsave: () => void;
}) {
  return (
    <Card aria-label={`Open ${room.title}`} gap="$x3" onPress={onOpen}>
      <XStack alignItems="flex-start" gap="$x3">
        <YStack
          alignItems="center"
          backgroundColor="$surfaceContainerLow"
          borderRadius="$control"
          height={72}
          justifyContent="center"
          overflow="hidden"
          width={72}
        >
          {room.coverImageUrl ? (
            <Image
              accessibilityIgnoresInvertColors
              source={{ uri: room.coverImageUrl }}
              style={{ width: 72, height: 72 }}
            />
          ) : (
            <AppIcon name="bed" size={28} />
          )}
        </YStack>
        <YStack flex={1} gap={2}>
          <AppText numberOfLines={2} variant="bodyStrong">
            {room.title}
          </AppText>
          <AppText tone="primary" variant="label">
            {formatMoney(room.price, 'USD')}/mo · {room.roomType}
          </AppText>
          {room.broadLocation ? (
            <AppText numberOfLines={1} tone="muted" variant="caption">
              {room.broadLocation}
            </AppText>
          ) : null}
        </YStack>
        <IconButton icon="heart" label={`Remove ${room.title} from saved`} onPress={onUnsave} />
      </XStack>
      <XStack gap="$x2" justifyContent="flex-end">
        <AppButton label="View details" onPress={onOpen} size="sm" variant="secondary" />
      </XStack>
    </Card>
  );
}
