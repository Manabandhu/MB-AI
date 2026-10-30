import { useRequireAuth } from '@/lib/authStore';
import { AdminGate } from '@/modules/admin/components/AdminGate';
import AdminCommunityScreen from '@/modules/admin/screens/AdminCommunityScreen';

export default function AdminCommunityRoute() {
  useRequireAuth('/sign-in');
  return (
    <AdminGate>
      <AdminCommunityScreen />
    </AdminGate>
  );
}
