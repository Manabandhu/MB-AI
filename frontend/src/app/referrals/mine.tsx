import { useRequireAuth } from '@/lib/authStore';
import { ReferralsScreen } from '@/modules/referrals/screens/ReferralsHomeScreen';

export default function MyReferralsRoute() {
  useRequireAuth('/sign-in');
  return <ReferralsScreen screenId="mine" />;
}
