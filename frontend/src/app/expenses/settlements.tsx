import { useRequireAuth } from '@/lib/authStore';
import { SettlementsScreen } from '@/modules/expenses/screens/SettlementsScreen';

export default function SettlementsRoute() {
  useRequireAuth('/sign-in');
  return <SettlementsScreen />;
}
