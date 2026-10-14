import { useRequireAuth } from '@/lib/authStore';
import { AdminGate } from '@/modules/admin/components/AdminGate';
import AdminEventsScreen from '@/modules/admin/screens/AdminEventsScreen';

export default function AdminEventsRoute() {
  useRequireAuth('/sign-in');
  return (
    <AdminGate>
      <AdminEventsScreen />
    </AdminGate>
  );
}
