import { useRequireAuth } from '@/lib/authStore';
import { AppShellScreen } from '@/modules/foundation/screens/shell/AppShellScreen';

export default function ChatRoute() {
  useRequireAuth('/sign-in');
  return <AppShellScreen kind="chat" />;
}
