import { useQuery } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { Fragment, useState } from 'react';
import { YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { getRideHistory } from '@/modules/rides/api';
import { InlineNotice } from '@/modules/rides/components/InlineNotice';
import { RepeatTripSheet } from '@/modules/rides/components/RepeatTripSheet';
import { formatDeparture } from '@/modules/rides/components/RideCard';
import { useTimedNotice } from '@/modules/rides/hooks/useTimedNotice';
import type { Ride } from '@/modules/rides/types';
import { errorMessage, statusIs, statusLabel, statusTone } from '@/modules/rides/utils/rideFormat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { OwnerItemCard, type OwnerItemOverflowAction } from '@/modules/shared/ui/OwnerItemCard';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

/**
 * Completed, cancelled or departed rides the user drove or rode on (`GET /rides/history`). Completed rides lead
 * with Rate (the server refuses a second rating and says so); drivers can repeat any past trip.
 */
export function RideHistoryScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const [repeatRide, setRepeatRide] = useState<Ride | null>(null);
  const notices = useTimedNotice();
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
          iconName="clock"
          onAction={() => router.push('/rides/search' as Href)}
          title="No ride history yet"
        />
      );
    }
    return (
      <YStack gap="$x3">
        {rides.map((ride) => {
          const completed = statusIs(ride.status, 'completed');
          const repeat = () => setRepeatRide(ride);
          const overflow: OwnerItemOverflowAction[] = [];
          if (ride.isDriver && completed) {
            overflow.push({ label: 'Repeat trip', icon: 'repeat', onPress: repeat });
          }
          if (ride.isDriver) {
            overflow.push({
              label: 'Manage ride',
              icon: 'settings',
              onPress: () => router.push(`/rides/${ride.id}/manage` as Href),
            });
          }
          return (
            <Fragment key={ride.id}>
              <OwnerItemCard
                actions={
                  completed ? (
                    <AppButton
                      icon="star"
                      label={ride.isDriver ? 'Rate riders' : 'Rate driver'}
                      onPress={() => router.push(`/rides/${ride.id}/rate` as Href)}
                      size="sm"
                    />
                  ) : ride.isDriver ? (
                    <AppButton
                      icon="repeat"
                      label="Repeat trip"
                      onPress={repeat}
                      size="sm"
                      variant="secondary"
                    />
                  ) : undefined
                }
                href={`/rides/${ride.id}` as Href}
                meta={[formatDeparture(ride.departureAt), ride.isDriver ? 'You drove' : 'You rode']}
                overflow={overflow.length ? overflow : undefined}
                status={
                  <StatusBadge label={statusLabel(ride.status)} tone={statusTone(ride.status)} />
                }
                title={ride.routeLabel}
                trailing={ride.contributionLabel ?? undefined}
              />
              <InlineNotice notice={notices.at(ride.id)} />
            </Fragment>
          );
        })}
      </YStack>
    );
  };

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <ScreenHeader
        back={{ fallback: '/rides/mine' as Href }}
        subtitle="Rate finished trips or post a past route again"
        title="Ride history"
      />
      {body()}
      <RepeatTripSheet
        onClose={() => setRepeatRide(null)}
        onPosted={(newRide) => {
          const from = repeatRide?.id ?? newRide.id;
          setRepeatRide(null);
          notices.show({
            anchor: from,
            text: 'Repeat trip posted. Riders can book it now.',
            href: `/rides/${newRide.id}/manage`,
            hrefLabel: 'Manage new ride',
          });
        }}
        ride={repeatRide}
      />
    </Screen>
  );
}
