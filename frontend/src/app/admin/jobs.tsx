import { useRequireAuth } from '@/lib/authStore';
import { AdminGate } from '@/modules/admin/components/AdminGate';
import AdminJobsScreen from '@/modules/admin/screens/AdminJobsScreen';

export default function AdminJobsRoute() {
  useRequireAuth('/sign-in');
  return (
    <AdminGate>
      <AdminJobsScreen />
    </AdminGate>
  );
}
