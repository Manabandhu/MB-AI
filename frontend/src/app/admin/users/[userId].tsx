import { useLocalSearchParams } from 'expo-router';
import { useRequireAuth } from '@/lib/authStore';
import { AdminGate } from '@/modules/admin/components/AdminGate';
import AdminUserDetailScreen from '@/modules/admin/screens/AdminUserDetailScreen';

export default function AdminUserDetailRoute() {
  useRequireAuth('/sign-in');
  const { userId } = useLocalSearchParams<{ userId: string }>();
  return (
    <AdminGate>
      <AdminUserDetailScreen userId={String(userId ?? '')} />
    </AdminGate>
  );
}
