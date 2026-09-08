import { useRequireAuth } from '@/lib/authStore';
import { PostDetailsScreen } from '@/modules/community/screens/PostDetailsScreen';

export default function PostDetailsRoute() {
  useRequireAuth('/sign-in');
  return <PostDetailsScreen />;
}
