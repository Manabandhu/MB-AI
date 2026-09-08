import { useRedirectIfAuthenticated } from '@/lib/authStore';
import { ResetPasswordScreen } from '@/modules/auth/screens/ResetPasswordScreen';

export default function ResetPasswordRoute() {
  useRedirectIfAuthenticated('/home');
  return <ResetPasswordScreen />;
}
