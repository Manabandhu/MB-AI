import { useRequireAuth } from '@/lib/authStore';
import { AdminGate } from '@/modules/admin/components/AdminGate';
import AdminUsersScreen from '@/modules/admin/screens/AdminUsersScreen';

export default function AdminUsersRoute() {
  useRequireAuth('/sign-in');
  return (
    <AdminGate>
      <AdminUsersScreen />
    </AdminGate>
  );
}
