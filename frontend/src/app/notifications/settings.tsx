import { useRequireAuth } from '@/lib/authStore';
import { NotificationSettingsScreen } from '@/modules/notifications/screens/NotificationSettingsScreen';

export default function NotificationSettingsRoute() {
  useRequireAuth('/sign-in');
  return <NotificationSettingsScreen />;
}
