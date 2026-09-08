import { useRequireAuth } from '@/lib/authStore';
import { CommunityJoinedScreen } from '@/modules/community/screens/CommunityJoinedScreen';

export default function CommunityJoinedRoute() {
  useRequireAuth('/sign-in');
  return <CommunityJoinedScreen />;
}
