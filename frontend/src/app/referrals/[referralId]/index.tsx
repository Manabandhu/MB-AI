import { useRequireAuth } from '@/lib/authStore';
import { ReferralDetailsScreen } from '@/modules/referrals/screens/ReferralDetailsScreen';

export default function ReferralDetailsRoute({ params }: { params: { referralId: string } }) {
  useRequireAuth('/sign-in');
  return <ReferralDetailsScreen referralId={params.referralId} />;
}
