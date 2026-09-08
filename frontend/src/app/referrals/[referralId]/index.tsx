import { useRequireAuth } from '@/lib/authStore';
import { ReferralDetailsScreen } from '@/modules/referrals/screens/ReferralDetailsScreen';

export default function ReferralDetailsRoute() {
  useRequireAuth('/sign-in');
  return <ReferralDetailsScreen />;
}