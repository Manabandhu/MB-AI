import { useRequireAuth } from '@/lib/authStore';
import AdminRoomsScreen from '@/modules/admin/screens/AdminRoomsScreen';

export default function AdminRoomsRoute() {
  useRequireAuth('/sign-in');
  return <AdminRoomsScreen />;
}
