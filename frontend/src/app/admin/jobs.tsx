import { useRequireAuth } from '@/lib/authStore';
import AdminJobsScreen from '@/modules/admin/screens/AdminJobsScreen';

export default function AdminJobsRoute() {
  useRequireAuth('/sign-in');
  return <AdminJobsScreen />;
}
