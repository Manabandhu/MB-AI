import { useRequireAuth } from '@/lib/authStore';
import AdminCommunityScreen from '@/modules/admin/screens/AdminCommunityScreen';

export default function AdminCommunityRoute() {
  useRequireAuth('/sign-in');
  return <AdminCommunityScreen />;
}
