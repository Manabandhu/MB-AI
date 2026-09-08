import { useRedirectIfAuthenticated } from '@/lib/authStore';
import { EmailLoginScreen } from '@/modules/auth/screens/EmailLoginScreen';

export default function EmailLoginRoute() {
  useRedirectIfAuthenticated('/home');
  return <EmailLoginScreen />;
}
