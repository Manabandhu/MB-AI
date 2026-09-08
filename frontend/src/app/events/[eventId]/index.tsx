import { useRequireAuth } from '@/lib/authStore';
import EventDetailsScreen from '@/modules/events/screens/EventDetailsScreen';

export default function EventDetailsRoute({ params }: { params: { eventId: string } }) {
  useRequireAuth('/sign-in');
  return <EventDetailsScreen eventId={params.eventId} />;
}
