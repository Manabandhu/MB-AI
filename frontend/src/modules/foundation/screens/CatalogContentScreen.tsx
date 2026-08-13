import { useQuery } from '@tanstack/react-query';

import { getFoundationScreenContent } from '@/modules/foundation/catalogApi';
import { foundationScreenFallbacks } from '@/modules/foundation/foundationScreenFallbacks';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

type CatalogContentScreenProps = {
  screenId: keyof typeof foundationScreenFallbacks;
};

export function CatalogContentScreen({ screenId }: CatalogContentScreenProps) {
  const fallback = foundationScreenFallbacks[screenId];
  const content = useQuery({
    queryKey: ['foundation', 'screen', screenId],
    queryFn: () => getFoundationScreenContent(screenId),
  });
  const data = content.data ?? fallback;

  return (
    <FeatureScreen
      cards={data.items.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        meta: item.meta ?? item.status,
        route: item.route,
      }))}
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}
