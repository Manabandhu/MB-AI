import { formatDate } from '@manabandhu/core';
import { type Href, router } from 'expo-router';
import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import type { Ride } from '@/modules/rides/types';
import {
  isJoinedRide,
  isWomenOnly,
  luggageLabel,
  recurrenceLabel,
  statusIs,
  statusLabel,
  statusTone,
  tollLabel,
} from '@/modules/rides/utils/rideFormat';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

export function formatDeparture(iso: string) {
  return formatDate(iso, 'weekdayTime') ?? 'Departure not set';
}

export function seatsText(ride: Pick<Ride, 'seatsAvailable' | 'seatsTotal'>) {
  if (ride.seatsAvailable <= 0) return 'Full';
  return `${ride.seatsAvailable} of ${ride.seatsTotal} ${ride.seatsTotal === 1 ? 'seat' : 'seats'} open`;
}

/**
 * Read-only facts from the ride record, shown as neutral tags. Pass `distance: false` where the distance is already
 * shown (the detail screen's route card prints it next to the duration).
 */
export function rideTags(ride: Ride, { distance = true }: { distance?: boolean } = {}) {
  return [
    ride.isRecurring ? (recurrenceLabel(ride.recurrencePattern) ?? 'Recurring') : null,
    isWomenOnly(ride.genderPreference) ? 'Women only' : null,
    tollLabel(ride.tollPreference),
    luggageLabel(ride.luggageCapacity),
    distance && ride.distanceMiles ? `${Math.round(ride.distanceMiles)} mi` : null,
  ].filter((t): t is string => Boolean(t));
}

const focusRing = {
  outlineWidth: 3,
  outlineStyle: 'solid',
  outlineColor: '$outlineColor',
} as const;

type RideCardProps = {
  ride: Ride;
  /** Show the status badge (lists that mix statuses). Search results are always active, so they omit it. */
  showStatus?: boolean;
  /** Bookmark state; pass with `onToggleSave` to show the heart. Rides the viewer rides on show "Joined" instead. */
  saved?: boolean;
  /** The viewer rides on this ride even though the view says otherwise (search views skip the passenger check). */
  joined?: boolean;
  onToggleSave?: () => void;
  saving?: boolean;
  /** Extra line under the facts, e.g. "You drove". */
  note?: string | null;
  /** Highlights the card (selected map pin). */
  selected?: boolean;
  /** Opens something other than the ride page. */
  onPress?: () => void;
  /** Controls under the card (kept outside the pressable summary). */
  footer?: ReactNode;
};

/**
 * One ride in any list (search, map selection, saved): price, route, departure, seats, record facts as tags, and
 * an optional heart. The summary opens the ride; the heart and footer are siblings so their presses never do.
 */
export function RideCard({
  ride,
  showStatus,
  saved,
  joined: joinedHint,
  onToggleSave,
  saving,
  note,
  selected,
  onPress,
  footer,
}: RideCardProps) {
  const tags = rideTags(ride);
  const departs = formatDeparture(ride.departureAt);
  const seats = seatsText(ride);
  const open = onPress ?? (() => router.push(`/rides/${ride.id}` as Href));
  const joined = joinedHint === true || isJoinedRide(ride);
  return (
    <Card
      borderColor={selected ? '$primary' : '$borderColor'}
      borderWidth={selected ? 2 : 1}
      gap={0}
      padding={0}
    >
      <XStack alignItems="flex-start">
        <YStack
          aria-label={[
            ride.routeLabel,
            `departs ${departs}`,
            seats,
            ride.contributionLabel,
            showStatus ? statusLabel(ride.status) : null,
          ]
            .filter(Boolean)
            .join(', ')}
          borderRadius="$card"
          cursor="pointer"
          flex={1}
          focusVisibleStyle={focusRing}
          focusable
          gap="$x2"
          hoverStyle={{ backgroundColor: '$surfaceContainerLow' }}
          minWidth={0}
          onPress={open}
          padding="$x4"
          pressStyle={{ backgroundColor: '$surfaceContainer' }}
          role="link"
        >
          <XStack alignItems="center" flexWrap="wrap" gap="$x2">
            {ride.contributionLabel ? (
              <AppText tone="primary" variant="h4">
                {ride.contributionLabel}
              </AppText>
            ) : null}
            {showStatus ? (
              <StatusBadge label={statusLabel(ride.status)} tone={statusTone(ride.status)} />
            ) : null}
          </XStack>
          <AppText numberOfLines={2} variant="bodyStrong">
            {ride.routeLabel}
          </AppText>
          <AppText tone="muted" variant="caption">
            Departs {departs}
          </AppText>
          <AppText
            tone={
              ride.seatsAvailable > 0 && !statusIs(ride.status, 'cancelled', 'completed')
                ? 'teal'
                : 'muted'
            }
            variant="label"
          >
            {seats}
          </AppText>
          {tags.length > 0 ? (
            <XStack flexWrap="wrap" gap="$x1">
              {tags.map((t) => (
                <Chip key={t} label={t} variant="tag" />
              ))}
            </XStack>
          ) : null}
          {note ? <AppText variant="caption">{note}</AppText> : null}
        </YStack>
        {joined ? (
          <YStack padding="$x3">
            <Chip icon="check" label="Joined" variant="tag" />
          </YStack>
        ) : onToggleSave ? (
          <YStack padding="$x2">
            <IconButton
              disabled={saving}
              icon="heart"
              label={
                saved ? `Remove ${ride.routeLabel} from saved rides` : `Save ${ride.routeLabel}`
              }
              onPress={onToggleSave}
              variant={saved ? 'solid' : 'plain'}
            />
          </YStack>
        ) : null}
      </XStack>
      {footer ? (
        <XStack flexWrap="wrap" gap="$x2" paddingBottom="$x3" paddingHorizontal="$x4">
          {footer}
        </XStack>
      ) : null}
    </Card>
  );
}
