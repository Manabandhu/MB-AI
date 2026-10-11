import { useRequireAuth } from '@/lib/authStore';
import { RoomCreateScreen } from '@/modules/rooms/screens/RoomCreateScreen';

export default function RoomsCreateListingRoute() {
  useRequireAuth('/sign-in');
  return <RoomCreateScreen />;
}
