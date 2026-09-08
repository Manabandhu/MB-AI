import { useRequireAuth } from '@/lib/authStore';
import { AddExpenseScreen } from '@/modules/expenses/screens/AddExpenseScreen';

export default function AddExpenseRoute() {
  useRequireAuth('/sign-in');
  return <AddExpenseScreen />;
}
