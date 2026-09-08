import { useRequireAuth } from '@/lib/authStore';
import AdminDashboardScreen from '@/modules/admin/screens/AdminDashboardScreen';

export default function AdminRoute() {
  useRequireAuth('/sign-in');
  return <AdminDashboardScreen />;
}
