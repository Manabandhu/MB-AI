import { useRequireAuth } from '@/lib/authStore';
import { AppShellScreen } from '@/modules/foundation/screens/shell/AppShellScreen';

export default function CommunityRoute() {
  useRequireAuth('/sign-in');
  return <AppShellScreen kind="community" />;
}
