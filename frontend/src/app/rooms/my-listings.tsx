import { useRequireAuth } from '@/lib/authStore';
import { RoomMyListingsScreen } from '@/modules/rooms/screens/RoomMyListingsScreen';

export default function RoomsMyListingsRoute() {
  useRequireAuth('/sign-in');
  return <RoomMyListingsScreen />;
}
