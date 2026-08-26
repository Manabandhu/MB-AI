import { GroupDetailsScreen } from '@/modules/expenses/screens/GroupDetailsScreen';

export default function GroupDetailsRoute({ params }: { params: { groupId: string } }) {
  return <GroupDetailsScreen groupId={params.groupId} />;
}
