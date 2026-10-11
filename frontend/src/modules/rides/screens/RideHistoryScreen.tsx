import { useQuery } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { getRideHistory } from '@/modules/rides/api';
import { RepeatTripSheet } from '@/modules/rides/components/RepeatTripSheet';
import { RideListCard } from '@/modules/rides/components/RideListCard';
import type { Ride } from '@/modules/rides/types';
import { errorMessage, statusIs } from '@/modules/rides/utils/rideFormat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Screen } from '@/modules/shared/ui/Screen';

/** Completed, cancelled or departed rides the user drove or rode on (`GET /rides/history`). */
export function RideHistoryScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const [repeatRide, setRepeatRide] = useState<Ride | null>(null);
  const [notice, setNotice] = useState<{ text: string; rideId: string } | null>(null);
  const query = useQuery({
    queryKey: ['rides', 'history'],
    queryFn: getRideHistory,
    enabled: isAuthenticated,
  });

  const body = () => {
    if (!isAuthenticated || query.isLoading) {
      return <LoadingState count={3} label="Loading ride history…" variant="skeleton" />;
    }
    if (query.isError) {
      return (
        <ErrorState
          body={errorMessage(query.error)}
          onRetry={() => query.refetch()}
          retryLabel="Retry"
          title="Could not load ride history"
        />
      );
    }
    const rides = query.data ?? [];
    if (rides.length === 0) {
      return (
        <EmptyState
          actionLabel="Find a ride"
          body="Rides you drove or rode on appear here once they finish, are cancelled, or depart."
          iconName="car"
          onAction={() => router.push('/rides/search' as Href)}
          title="No ride history yet"
        />
      );
    }
    return (
      <YStack gap="$x3">
        {rides.map((ride) => (
          <RideListCard key={ride.id} note={ride.isDriver ? 'You drove' : 'You rode'} ride={ride}>
            <AppButton
              label="View"
              onPress={() => router.push(`/rides/${ride.id}` as Href)}
              variant="ghost"
            />
            {statusIs(ride.status, 'completed') ? (
              <AppButton
                label={ride.isDriver ? 'Rate riders' : 'Rate driver'}
                onPress={() => router.push(`/rides/${ride.id}/rate` as Href)}
                variant="secondary"
              />
            ) : null}
            {ride.isDriver ? (
              <AppButton icon="refresh" label="Repeat trip" onPress={() => setRepeatRide(ride)} />
            ) : null}
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
            Ride history
          </AppText>
          <AppText tone="muted" variant="caption">
            Rate finished trips or post a past route again
          </AppText>
        </YStack>
        {notice ? (
          <Card aria-live="polite" gap="$x2" variant="tinted">
            <AppText variant="label">{notice.text}</AppText>
            <AppButton
              label="View new ride"
              onPress={() => router.push(`/rides/${notice.rideId}` as Href)}
              variant="secondary"
            />
          </Card>
        ) : null}
        {body()}
      </YStack>
      <RepeatTripSheet
        onClose={() => setRepeatRide(null)}
        onPosted={(newRide) => {
          setRepeatRide(null);
          setNotice({ text: 'Repeat trip posted. Riders can book it now.', rideId: newRide.id });
        }}
        ride={repeatRide}
      />
    </Screen>
  );
}
