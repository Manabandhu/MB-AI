import { useRequireAuth } from '@/lib/authStore';
import { RoomsScreen } from '@/modules/rooms/screens/RoomsScreen';

export default function RoomsMapRoute() {
  useRequireAuth('/sign-in');
  return <RoomsScreen screenId="map" />;
}
