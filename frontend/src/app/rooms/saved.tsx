import { useRequireAuth } from '@/lib/authStore';
import { RoomFavoritesScreen } from '@/modules/rooms/screens/RoomFavoritesScreen';

export default function RoomsSavedRoute() {
  useRequireAuth('/sign-in');
  return <RoomFavoritesScreen />;
}
