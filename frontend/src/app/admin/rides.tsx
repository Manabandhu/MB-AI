import { useRequireAuth } from '@/lib/authStore';
import { AdminGate } from '@/modules/admin/components/AdminGate';
import AdminRidesScreen from '@/modules/admin/screens/AdminRidesScreen';

export default function AdminRidesRoute() {
  useRequireAuth('/sign-in');
  return (
    <AdminGate>
      <AdminRidesScreen />
    </AdminGate>
  );
}
