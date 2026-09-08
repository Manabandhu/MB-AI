import { useRequireAuth } from '@/lib/authStore';
import AdminRidesScreen from '@/modules/admin/screens/AdminRidesScreen';

export default function AdminRidesRoute() {
  useRequireAuth('/sign-in');
  return <AdminRidesScreen />;
}
