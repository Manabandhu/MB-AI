import { useRequireAuth } from '@/lib/authStore';
import { AccountDataScreen } from '@/modules/foundation/account/AccountDataScreen';

export default function AccountDataRoute() {
  useRequireAuth('/sign-in');
  return <AccountDataScreen />;
}
