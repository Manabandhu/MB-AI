import { useRequireAuth } from '@/lib/authStore';
import { StitchAppShellScreen } from '@/modules/foundation/screens/StitchAppShellScreen';

export default function ChatRoute() {
  useRequireAuth('/sign-in');
  return <StitchAppShellScreen kind="chat" />;
}
