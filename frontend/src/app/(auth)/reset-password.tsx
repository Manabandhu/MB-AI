import { ResetPasswordScreen } from '@/modules/auth/screens/ResetPasswordScreen';

// No signed-in redirect here: the recovery link signs the member in so they can set a new password.
export default function ResetPasswordRoute() {
  return <ResetPasswordScreen />;
}
