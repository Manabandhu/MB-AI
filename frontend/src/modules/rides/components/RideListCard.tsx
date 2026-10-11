import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import type { Ride } from '@/modules/rides/types';
import { recurrenceLabel, statusIs, statusLabel } from '@/modules/rides/utils/rideFormat';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';

export function formatDeparture(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Departure not set';
  return d.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** One ride in a list: route, departure, status and seats from the ride record, plus the caller's actions. */
export function RideListCard({
  ride,
  children,
  note,
}: {
  ride: Ride;
  children?: ReactNode;
  /** Extra line under the details (e.g. the viewer's booking). */
  note?: string | null;
}) {
  const seats = `${ride.seatsAvailable} of ${ride.seatsTotal} ${ride.seatsTotal === 1 ? 'seat' : 'seats'} open`;
  return (
    <Card gap="$x3" variant="outlined">
      <XStack alignItems="center" flexWrap="wrap" gap="$x2" justifyContent="space-between">
        <Chip label={statusLabel(ride.status)} selected={statusIs(ride.status, 'active')} />
        {ride.contributionLabel ? (
          <AppText tone="primary" variant="bodyStrong">
            {ride.contributionLabel}
          </AppText>
        ) : null}
      </XStack>
      <YStack gap="$x1">
        <AppText numberOfLines={2} variant="bodyStrong">
          {ride.routeLabel}
        </AppText>
        <AppText tone="muted" variant="caption">
          {formatDeparture(ride.departureAt)}
          {ride.isRecurring ? ` · ${recurrenceLabel(ride.recurrencePattern) ?? 'Recurring'}` : ''}
        </AppText>
        <AppText tone="muted" variant="caption">
          {seats}
        </AppText>
        {note ? <AppText variant="caption">{note}</AppText> : null}
      </YStack>
      {children ? (
        <XStack flexWrap="wrap" gap="$x2">
          {children}
        </XStack>
      ) : null}
    </Card>
  );
}
