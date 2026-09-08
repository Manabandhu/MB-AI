import { useRequireAuth } from '@/lib/authStore';
import { StitchAppShellScreen } from '@/modules/foundation/screens/StitchAppShellScreen';

export default function ExploreRoute() {
  useRequireAuth('/sign-in');
  return <StitchAppShellScreen kind="explore" />;
}
