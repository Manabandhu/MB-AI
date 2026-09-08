import { useRequireAuth } from '@/lib/authStore';
import { RoomsScreen } from '@/modules/rooms/screens/RoomsScreen';

export default function RoomsRoute() {
  useRequireAuth('/sign-in');
  return <RoomsScreen screenId="home" />;
}
