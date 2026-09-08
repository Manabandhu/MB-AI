import { useRequireAuth } from '@/lib/authStore';
import { SettingsScreen } from '@/modules/foundation/screens/SettingsScreen';

export default function SettingsRoute() {
  useRequireAuth('/sign-in');
  return <SettingsScreen />;
}
