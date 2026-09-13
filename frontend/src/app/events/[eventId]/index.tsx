import EventDetailsScreen from '@/modules/events/screens/EventDetailsScreen';

export default function EventDetailsRoute({ params }: { params: { eventId: string } }) {
  return <EventDetailsScreen eventId={params.eventId} />;
}
