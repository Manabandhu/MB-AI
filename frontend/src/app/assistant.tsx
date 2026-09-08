import { useRequireAuth } from '@/lib/authStore';
import { AssistantScreen } from '@/modules/ai-assistant/screens/AssistantScreen';

export default function AssistantRoute() {
  useRequireAuth('/sign-in');
  return <AssistantScreen />;
}
