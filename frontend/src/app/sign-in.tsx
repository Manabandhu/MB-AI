import { useRedirectIfAuthenticated } from '@/lib/authStore';
import { SignInScreen } from '@/modules/auth/screens/SignInScreen';

export default function SignInRoute() {
  useRedirectIfAuthenticated('/home');
  return <SignInScreen />;
}
