import { useRequireAuth } from '@/lib/authStore';
import { RequestReferralScreen } from '@/modules/referrals/screens/RequestReferralScreen';

export default function RequestReferralRoute() {
  useRequireAuth('/sign-in');
  return <RequestReferralScreen />;
}
