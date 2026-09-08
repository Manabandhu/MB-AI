import { useRequireAuth } from '@/lib/authStore';
import { ExpensesScreen } from '@/modules/expenses/screens/ExpensesHomeScreen';

export default function ExpensesGroupsRoute() {
  useRequireAuth('/sign-in');
  return <ExpensesScreen screenId="groups" />;
}
