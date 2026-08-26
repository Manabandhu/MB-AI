import { ResourceDetailScreen } from '@/modules/immigration/screens/ResourceDetailScreen';

export default function ResourceDetailRoute({ params }: { params: { resourceId: string } }) {
  return <ResourceDetailScreen resourceId={params.resourceId} />;
}
