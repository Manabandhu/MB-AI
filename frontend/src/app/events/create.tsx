import { useRequireAuth } from '@/lib/authStore';
import CreateEventScreen from '@/modules/events/screens/CreateEventScreen';

export default function CreateEventRoute() {
  useRequireAuth('/sign-in');
  return <CreateEventScreen />;
}
