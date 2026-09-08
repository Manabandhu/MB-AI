import { useRequireAuth } from '@/lib/authStore';
import { GroupDetailsScreen } from '@/modules/expenses/screens/GroupDetailsScreen';

export default function GroupDetailsRoute({ params }: { params: { groupId: string } }) {
  useRequireAuth('/sign-in');
  return <GroupDetailsScreen groupId={params.groupId} />;
}
