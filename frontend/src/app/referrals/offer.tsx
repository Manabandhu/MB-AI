import { useRequireAuth } from '@/lib/authStore';
import { OfferReferralScreen } from '@/modules/referrals/screens/OfferReferralScreen';

export default function OfferReferralRoute() {
  useRequireAuth('/sign-in');
  return <OfferReferralScreen />;
}
