import { useRequireAuth } from '@/lib/authStore';
import { PostJobScreen } from '@/modules/jobs/screens/PostJobScreen';

export default function PostJobRoute() {
  useRequireAuth('/sign-in');
  return <PostJobScreen />;
}
