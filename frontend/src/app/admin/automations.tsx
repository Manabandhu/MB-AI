import { useRequireAuth } from '@/lib/authStore';
import AdminAutomationsScreen from '@/modules/admin/screens/AdminAutomationsScreen';

export default function AdminAutomationsRoute() {
  useRequireAuth('/sign-in');
  return <AdminAutomationsScreen />;
}
