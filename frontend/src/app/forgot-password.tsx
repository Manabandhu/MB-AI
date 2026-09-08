import { useRedirectIfAuthenticated } from '@/lib/authStore';
import { ForgotPasswordScreen } from '@/modules/auth/screens/ForgotPasswordScreen';

export default function ForgotPasswordRoute() {
  useRedirectIfAuthenticated('/home');
  return <ForgotPasswordScreen />;
}
