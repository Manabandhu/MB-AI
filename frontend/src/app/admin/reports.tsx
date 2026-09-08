import { useRequireAuth } from '@/lib/authStore';
import AdminReportsScreen from '@/modules/admin/screens/AdminReportsScreen';

export default function AdminReportsRoute() {
  useRequireAuth('/sign-in');
  return <AdminReportsScreen />;
}
