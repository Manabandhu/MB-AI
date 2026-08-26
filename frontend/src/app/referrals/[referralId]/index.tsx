import { ReferralDetailsScreen } from '@/modules/referrals/screens/ReferralDetailsScreen';

export default function ReferralDetailsRoute({ params }: { params: { referralId: string } }) {
  return <ReferralDetailsScreen referralId={params.referralId} />;
}
