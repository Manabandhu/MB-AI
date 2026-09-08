import { useRequireAuth } from '@/lib/authStore';
import AdminAuditLogScreen from '@/modules/admin/screens/AdminAuditLogScreen';

export default function AdminAuditLogRoute() {
  useRequireAuth('/sign-in');
  return <AdminAuditLogScreen />;
}
