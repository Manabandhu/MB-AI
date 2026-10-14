import { useRequireAuth } from '@/lib/authStore';
import { ExpenseGroupsScreen } from '@/modules/expenses/screens/ExpenseGroupsScreen';

export default function ExpensesGroupsRoute() {
  useRequireAuth('/sign-in');
  return <ExpenseGroupsScreen />;
}
