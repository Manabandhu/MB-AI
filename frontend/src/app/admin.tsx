import { useRequireAuth } from '@/lib/authStore';
import { AdminGate } from '@/modules/admin/components/AdminGate';
import AdminDashboardScreen from '@/modules/admin/screens/AdminDashboardScreen';

export default function AdminRoute() {
  useRequireAuth('/sign-in');
  return (
    <AdminGate>
      <AdminDashboardScreen />
    </AdminGate>
  );
}
