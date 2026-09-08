import { useRequireAuth } from '@/lib/authStore';
import { CommunityDetailsScreen } from '@/modules/community/screens/CommunityDetailsScreen';

export default function CommunityDetailsRoute() {
  useRequireAuth('/sign-in');
  return <CommunityDetailsScreen />;
}
