import { useLocalSearchParams } from 'expo-router';
import { useRequireAuth } from '@/lib/authStore';
import { GroupDetailsScreen } from '@/modules/expenses/screens/GroupDetailsScreen';

export default function GroupDetailsRoute() {
  useRequireAuth('/sign-in');
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  return <GroupDetailsScreen groupId={groupId ?? ''} />;
}
