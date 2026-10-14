import { useRequireAuth } from '@/lib/authStore';
import { AdminGate } from '@/modules/admin/components/AdminGate';
import AdminAutomationsScreen from '@/modules/admin/screens/AdminAutomationsScreen';

export default function AdminAutomationsRoute() {
  useRequireAuth('/sign-in');
  return (
    <AdminGate require="SUPER_ADMIN">
      <AdminAutomationsScreen />
    </AdminGate>
  );
}
