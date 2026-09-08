import { useRequireAuth } from '@/lib/authStore';
import { StitchAppShellScreen } from '@/modules/foundation/screens/StitchAppShellScreen';

export default function HomeRoute() {
  useRequireAuth('/sign-in');
  return <StitchAppShellScreen kind="home" />;
}
