import { useQuery } from '@tanstack/react-query';

import { getNotificationsInbox } from '@/modules/notifications/api';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

const fallbackInbox = {
  eyebrow: 'Notifications',
  title: 'Inbox',
  subtitle: 'Important updates from rooms, rides, communities, and account safety appear here.',
  metrics: [
    { label: 'Unread', value: '3' },
    { label: 'Today', value: '7' },
  ],
  items: [
    {
      id: 'room-match',
      title: 'New room match',
      body: 'A room in Irving now matches your saved budget and move-in date.',
      meta: 'Rooms',
    },
    {
      id: 'ride-seat',
      title: 'Ride seat available',
      body: 'A DFW airport ride has two open seats for Saturday morning.',
      meta: 'Rides',
    },
  ],
};

export function NotificationsInboxScreen() {
  const inbox = useQuery({ queryKey: ['notifications', 'inbox'], queryFn: getNotificationsInbox });
  const data = inbox.data ?? fallbackInbox;

  return (
    <FeatureScreen
      cards={data.items}
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}
