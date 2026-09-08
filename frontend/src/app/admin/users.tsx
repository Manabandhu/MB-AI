import { useRequireAuth } from '@/lib/authStore';
import AdminUsersScreen from '@/modules/admin/screens/AdminUsersScreen';

export default function AdminUsersRoute() {
  useRequireAuth('/sign-in');
  return <AdminUsersScreen />;
}
