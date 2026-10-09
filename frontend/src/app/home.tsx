import { useRequireAuth } from '@/lib/authStore';
import { AppShellScreen } from '@/modules/foundation/screens/shell/AppShellScreen';

export default function HomeRoute() {
  useRequireAuth('/sign-in');
  return <AppShellScreen kind="home" />;
}
