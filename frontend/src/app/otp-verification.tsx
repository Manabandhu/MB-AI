import { useRedirectIfAuthenticated } from '@/lib/authStore';
import { OtpVerificationScreen } from '@/modules/auth/screens/OtpVerificationScreen';

export default function OtpVerificationRoute() {
  useRedirectIfAuthenticated();
  return <OtpVerificationScreen />;
}
