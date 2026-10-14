import { useRequireAuth } from '@/lib/authStore';
import { SafetyCenterScreen } from '@/modules/safety/screens/SafetyCenterScreen';

export default function SafetyRoute() {
  useRequireAuth('/sign-in');
  return <SafetyCenterScreen />;
}
