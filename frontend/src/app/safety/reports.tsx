import { useRequireAuth } from '@/lib/authStore';
import { ReportsScreen } from '@/modules/safety/screens/ReportsScreen';

export default function SafetyReportsRoute() {
  useRequireAuth('/sign-in');
  return <ReportsScreen />;
}
