import { useRequireAuth } from '@/lib/authStore';
import { RoomsScreen } from '@/modules/rooms/screens/RoomsScreen';

export default function RoomsFiltersRoute() {
  useRequireAuth('/sign-in');
  return <RoomsScreen screenId="filters" />;
}
