import { useRequireAuth } from '@/lib/authStore';
import { RoomDetailScreen } from '@/modules/rooms/screens/RoomDetailScreen';

export default function RoomDetailsRoute() {
  useRequireAuth('/sign-in');
  return <RoomDetailScreen />;
}
