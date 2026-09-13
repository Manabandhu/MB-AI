import { useLocalSearchParams } from 'expo-router';
import EventDetailsScreen from '@/modules/events/screens/EventDetailsScreen';

export default function EventDetailsRoute() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return <EventDetailsScreen eventId={eventId} />;
}
