import { useRequireAuth } from '@/lib/authStore';
import { SavedScreen } from '@/modules/foundation/screens/SavedScreen';

export default function SavedRoute() {
  useRequireAuth('/sign-in');
  return <SavedScreen />;
}
