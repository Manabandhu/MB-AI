import { useLocalSearchParams } from 'expo-router';
import { ResourceDetailScreen } from '@/modules/immigration/screens/ResourceDetailScreen';

export default function ResourceDetailRoute() {
  const { resourceId } = useLocalSearchParams<{ resourceId: string }>();
  return <ResourceDetailScreen resourceId={resourceId!} />;
}
