import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useAuthStore } from '@/lib/authStore';
import { listMyEvents } from '@/modules/events/api';
import { EventListScreen } from '@/modules/events/components/EventListScreen';

/** Events the signed-in member organizes (`GET /api/v1/events/mine`). */
export default function MyEventsScreen() {
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const query = useQuery({
    queryKey: ['events', 'mine'],
    queryFn: listMyEvents,
    enabled: signedIn,
  });
  return (
    <EventListScreen
      badgeFor={() => 'Hosting'}
      empty={{
        title: 'No events yet',
        body: 'Events you host appear here.',
        actionLabel: 'Host an event',
        route: '/events/create' as Href,
      }}
      query={query}
      ready={signedIn}
      subtitle="Events you are hosting"
      title="My events"
    />
  );
}
