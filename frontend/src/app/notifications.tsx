import { useRequireAuth } from '@/lib/authStore';
import { NotificationsInboxScreen } from '@/modules/notifications/screens/NotificationsInboxScreen';

export default function NotificationsRoute() {
  useRequireAuth('/sign-in');
  return <NotificationsInboxScreen />;
}
