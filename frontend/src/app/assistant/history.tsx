import { useRequireAuth } from '@/lib/authStore';
import { AssistantHistoryScreen } from '@/modules/ai-assistant/screens/AssistantHistoryScreen';

export default function AssistantHistoryRoute() {
  useRequireAuth('/sign-in');
  return <AssistantHistoryScreen />;
}
