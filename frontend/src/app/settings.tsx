import { useRequireAuth } from '@/lib/authStore';
import { SettingsScreen } from '@/modules/foundation/settings/SettingsScreen';

export default function SettingsRoute() {
  useRequireAuth('/sign-in');
  return <SettingsScreen />;
}
