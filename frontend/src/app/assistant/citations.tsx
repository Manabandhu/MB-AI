import { useRequireAuth } from '@/lib/authStore';
import { AssistantCitationsScreen } from '@/modules/ai-assistant/screens/AssistantCitationsScreen';

export default function AssistantCitationsRoute() {
  useRequireAuth('/sign-in');
  return <AssistantCitationsScreen />;
}
