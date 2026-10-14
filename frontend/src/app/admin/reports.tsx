import { useRequireAuth } from '@/lib/authStore';
import { AdminGate } from '@/modules/admin/components/AdminGate';
import AdminReportsScreen from '@/modules/admin/screens/AdminReportsScreen';

export default function AdminReportsRoute() {
  useRequireAuth('/sign-in');
  return (
    <AdminGate>
      <AdminReportsScreen />
    </AdminGate>
  );
}
