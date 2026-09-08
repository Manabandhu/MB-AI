import { useRequireAuth } from '@/lib/authStore';
import { CreatePostScreen } from '@/modules/community/screens/CreatePostScreen';

export default function CreatePostRoute() {
  useRequireAuth('/sign-in');
  return <CreatePostScreen />;
}
