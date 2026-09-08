import { useRequireAuth } from '@/lib/authStore';
import { TrustedContactsScreen } from '@/modules/safety/screens/TrustedContactsScreen';

export default function SafetyTrustedContactsRoute() {
  useRequireAuth('/sign-in');
  return <TrustedContactsScreen />;
}
