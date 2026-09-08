import { useRequireAuth } from '@/lib/authStore';
import SavedEventsScreen from '@/modules/events/screens/SavedEventsScreen';

export default function SavedEventsRoute() {
  useRequireAuth('/sign-in');
  return <SavedEventsScreen />;
}
