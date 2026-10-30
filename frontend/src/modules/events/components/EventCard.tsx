import { formatDate, formatTime } from '@manabandhu/core';
import type { Href } from 'expo-router';
import { XStack } from 'tamagui';
import type { Event } from '@/modules/events/api';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

/** "Sat, Oct 18 · 6:00 PM" from an ISO `startAt`, or a placeholder when missing. */
function formatEventWhen(startAt?: string | null) {
  if (!startAt) return 'Date to be announced';
  return formatDate(startAt, 'weekdayTime') ?? formatTime(startAt) ?? 'Date to be announced';
}

/** An event in a list: title, when (from `startAt`), where. Opens the event. */
export function EventCard({ event, badge }: { event: Event; badge?: string }) {
  const past = event.endAt ? new Date(event.endAt).getTime() < Date.now() : false;
  return (
    <Card aria-label={event.title} href={`/events/${event.id}` as Href}>
      <Heading numberOfLines={2} variant="h4">
        {event.title}
      </Heading>
      <AppText tone="primary" variant="label">
        {formatEventWhen(event.startAt)}
      </AppText>
      {event.location ? (
        <AppText numberOfLines={1} tone="muted">
          {event.location}
        </AppText>
      ) : null}
      {badge || past ? (
        <XStack flexWrap="wrap" gap="$x2">
          {badge ? <StatusBadge label={badge} tone="success" /> : null}
          {past ? <StatusBadge label="Ended" /> : null}
        </XStack>
      ) : null}
    </Card>
  );
}
