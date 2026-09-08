import { useRequireAuth } from '@/lib/authStore';
import { RoomEditScreen } from '@/modules/rooms/screens/RoomEditScreen';

export default function RoomEditRoute() {
  useRequireAuth('/sign-in');
  return <RoomEditScreen />;
}
