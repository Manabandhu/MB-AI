import { useRequireAuth } from '@/lib/authStore';
import { RoomFavoritesScreen } from '@/modules/rooms/screens/RoomListScreens';

export default function RoomsSavedRoute() {
  useRequireAuth('/sign-in');
  return <RoomFavoritesScreen />;
}
