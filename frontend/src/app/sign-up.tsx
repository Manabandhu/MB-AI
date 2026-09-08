import { useRedirectIfAuthenticated } from '@/lib/authStore';
import { SignUpScreen } from '@/modules/auth/screens/SignUpScreen';

export default function SignUpRoute() {
  useRedirectIfAuthenticated('/home');
  return <SignUpScreen />;
}
