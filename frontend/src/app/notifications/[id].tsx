import { useRequireAuth } from '@/lib/authStore';
import { NotificationDetailScreen } from '@/modules/notifications/screens/NotificationDetailScreen';

export default function NotificationDetailRoute() {
  useRequireAuth('/sign-in');
  return <NotificationDetailScreen />;
}
