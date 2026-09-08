import { useRequireAuth } from '@/lib/authStore';
import ConversationInfoScreen from '@/modules/chat/screens/ConversationInfoScreen';

export default function ConversationInfoRoute() {
  useRequireAuth('/sign-in');
  return <ConversationInfoScreen />;
}
