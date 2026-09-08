import { useRequireAuth } from '@/lib/authStore';
import { CommunityDiscoverScreen } from '@/modules/community/screens/CommunityDiscoverScreen';

export default function CommunityDiscoverRoute() {
  useRequireAuth('/sign-in');
  return <CommunityDiscoverScreen />;
}
