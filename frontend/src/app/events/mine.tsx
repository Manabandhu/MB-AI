import { useRequireAuth } from '@/lib/authStore';
import MyEventsScreen from '@/modules/events/screens/MyEventsScreen';

export default function MyEventsRoute() {
  useRequireAuth('/sign-in');
  return <MyEventsScreen />;
}
