import { useRedirectIfAuthenticated } from '@/lib/authStore';
import { PhoneLoginScreen } from '@/modules/auth/screens/PhoneLoginScreen';

export default function PhoneLoginRoute() {
  useRedirectIfAuthenticated('/home');
  return <PhoneLoginScreen />;
}
