import { useRequireAuth } from '@/lib/authStore';
import { AdminGate } from '@/modules/admin/components/AdminGate';
import AdminAuditLogScreen from '@/modules/admin/screens/AdminAuditLogScreen';

export default function AdminAuditLogRoute() {
  useRequireAuth('/sign-in');
  return (
    <AdminGate>
      <AdminAuditLogScreen />
    </AdminGate>
  );
}
