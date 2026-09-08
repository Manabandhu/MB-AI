import { useRequireAuth } from '@/lib/authStore';
import ConversationScreen from '@/modules/chat/screens/ConversationScreen';

export default function ConversationRoute() {
  useRequireAuth('/sign-in');
  return <ConversationScreen />;
}
