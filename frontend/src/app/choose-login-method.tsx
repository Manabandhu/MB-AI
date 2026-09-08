import { useRedirectIfAuthenticated } from '@/lib/authStore';
import { ChooseLoginMethodScreen } from '@/modules/auth/screens/ChooseLoginMethodScreen';

export default function ChooseLoginMethodRoute() {
  useRedirectIfAuthenticated('/home');
  return <ChooseLoginMethodScreen />;
}
