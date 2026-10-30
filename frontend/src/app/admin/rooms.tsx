import { useRequireAuth } from '@/lib/authStore';
import { AdminGate } from '@/modules/admin/components/AdminGate';
import AdminRoomsScreen from '@/modules/admin/screens/AdminRoomsScreen';

export default function AdminRoomsRoute() {
  useRequireAuth('/sign-in');
  return (
    <AdminGate>
      <AdminRoomsScreen />
    </AdminGate>
  );
}
