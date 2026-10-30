import { useLocalSearchParams } from 'expo-router';
import { useRequireAuth } from '@/lib/authStore';
import { AdminGate } from '@/modules/admin/components/AdminGate';
import AdminReportDetailScreen from '@/modules/admin/screens/AdminReportDetailScreen';

export default function AdminReportDetailRoute() {
  useRequireAuth('/sign-in');
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  return (
    <AdminGate>
      <AdminReportDetailScreen reportId={String(reportId ?? '')} />
    </AdminGate>
  );
}
