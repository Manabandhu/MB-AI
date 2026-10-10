import { formatDate } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { persistMeta } from '@/lib/queryPersistence';
import { WidgetFrame } from '@/modules/shared/components/WidgetFrame';
import { ListRow } from '@/modules/shared/ui/ListRow';
import { listEvents } from '../api';

/** The next three upcoming events. */
export function EventsHomeWidget() {
  const query = useQuery({
    queryKey: ['events', 'home-widget'],
    queryFn: listEvents,
    staleTime: 60_000,
    meta: persistMeta,
  });
  const now = Date.now();
  const events = (query.data ?? [])
    .filter((event) => event.startAt && new Date(event.startAt).getTime() > now)
    .sort((a, b) => new Date(a.startAt ?? 0).getTime() - new Date(b.startAt ?? 0).getTime())
    .slice(0, 3);
  return (
    <WidgetFrame
      empty={{
        title: 'No upcoming events',
        body: 'Host a meetup, celebration, or study group.',
        actionLabel: 'Create an event',
        actionHref: '/events/create',
      }}
      icon="event"
      isEmpty={events.length === 0}
      isError={query.isError}
      isLoading={query.isLoading}
      onRetry={() => query.refetch()}
      seeAll={{ href: '/events' }}
      title="Upcoming events"
    >
      {events.map((event) => (
        <ListRow
          href={`/events/${event.id}`}
          icon="calendar"
          key={event.id}
          meta={formatDate(event.startAt, 'short')}
          subtitle={event.location}
          title={event.title}
          tone="warm"
        />
      ))}
    </WidgetFrame>
  );
}
