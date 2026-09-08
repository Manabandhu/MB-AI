import { useRequireAuth } from '@/lib/authStore';
import { BalancesScreen } from '@/modules/expenses/screens/BalancesScreen';

export default function BalancesRoute() {
  useRequireAuth('/sign-in');
  return <BalancesScreen />;
}
