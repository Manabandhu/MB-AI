import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useAuthStore } from '@/lib/authStore';
import { listSavedEvents } from '@/modules/events/api';
import { EventListScreen } from '@/modules/events/components/EventListScreen';

/** Events the member RSVPed to (going, interested, maybe) or saved (`GET /api/v1/events/saved`). */
export default function SavedEventsScreen() {
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const query = useQuery({
    queryKey: ['events', 'saved'],
    queryFn: listSavedEvents,
    enabled: signedIn,
  });
  return (
    <EventListScreen
      empty={{
        title: 'Nothing saved yet',
        body: 'Save or RSVP to an event and it shows up here.',
        actionLabel: 'Browse events',
        route: '/events' as Href,
      }}
      query={query}
      ready={signedIn}
      subtitle="Events you saved or RSVPed to"
      title="Saved events"
    />
  );
}
