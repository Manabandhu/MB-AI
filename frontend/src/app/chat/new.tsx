import { useRequireAuth } from '@/lib/authStore';
import NewChatScreen from '@/modules/chat/screens/NewChatScreen';

export default function NewChatRoute() {
  useRequireAuth('/sign-in');
  return <NewChatScreen />;
}
