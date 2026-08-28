import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRoomForOwner } from '@/modules/rooms/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { RoomForm } from './RoomForm';

export function RoomEditScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rooms', 'owner', roomId],
    queryFn: () => getRoomForOwner(roomId),
    enabled: Boolean(roomId),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ErrorState
          title="Unable to load listing"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return <RoomForm mode="edit" initial={data} />;
}
