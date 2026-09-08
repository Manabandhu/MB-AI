import { useRequireAuth } from '@/lib/authStore';
import { BlockedUsersScreen } from '@/modules/safety/screens/BlockedUsersScreen';

export default function SafetyBlockedUsersRoute() {
  useRequireAuth('/sign-in');
  return <BlockedUsersScreen />;
}
