import { useRequireAuth } from '@/lib/authStore';
import AdminEventsScreen from '@/modules/admin/screens/AdminEventsScreen';

export default function AdminEventsRoute() {
  useRequireAuth('/sign-in');
  return <AdminEventsScreen />;
}
