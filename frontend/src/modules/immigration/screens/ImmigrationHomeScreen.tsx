import { useQuery } from '@tanstack/react-query';
import { getImmigrationScreen } from '@/modules/immigration/api';
import { immigrationScreenFallbacks } from '@/modules/immigration/immigrationFallbacks';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

type ImmigrationScreenProps = {
  screenId: keyof typeof immigrationRoutes;
};

export function ImmigrationScreen({ screenId }: ImmigrationScreenProps) {
  const fallback = immigrationScreenFallbacks[screenId];
  const screen = useQuery({
    queryKey: ['immigration', 'screen', screenId],
    queryFn: () => getImmigrationScreen(screenId),
  });
  const data = screen.data ?? fallback;

  return (
    <FeatureScreen
      actions={immigrationActions[screenId]}
      cards={data.items}
      currentRoute={immigrationRoutes[screenId]}
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}

const immigrationRoutes = {
  home: '/immigration',
  resources: '/immigration/resources',
  guides: '/immigration/guides',
  checklists: '/immigration/checklists',
  faq: '/immigration/faq',
  questions: '/immigration/questions',
  uscis: '/immigration/uscis',
  news: '/immigration/news',
  saved: '/immigration/saved',
} as const;

const immigrationActions = {
  home: [
    { label: 'Resources', route: '/immigration/resources' },
    { label: 'Guides', route: '/immigration/guides' },
    { label: 'Checklists', route: '/immigration/checklists' },
    { label: 'FAQ', route: '/immigration/faq' },
    { label: 'Saved', route: '/immigration/saved' },
  ],
  resources: [
    { label: 'Guides', route: '/immigration/guides' },
    { label: 'FAQ', route: '/immigration/faq' },
    { label: 'Saved', route: '/immigration/saved' },
  ],
  guides: [
    { label: 'Resources', route: '/immigration/resources' },
    { label: 'Checklists', route: '/immigration/checklists' },
  ],
  checklists: [
    { label: 'Guides', route: '/immigration/guides' },
    { label: 'Resources', route: '/immigration/resources' },
  ],
  faq: [
    { label: 'Resources', route: '/immigration/resources' },
    { label: 'Questions', route: '/immigration/questions' },
  ],
  questions: [
    { label: 'FAQ', route: '/immigration/faq' },
    { label: 'Resources', route: '/immigration/resources' },
  ],
  uscis: [
    { label: 'News', route: '/immigration/news' },
    { label: 'Guides', route: '/immigration/guides' },
  ],
  news: [
    { label: 'USCIS alerts', route: '/immigration/uscis' },
    { label: 'Resources', route: '/immigration/resources' },
  ],
  saved: [
    { label: 'Resources', route: '/immigration/resources' },
    { label: 'Guides', route: '/immigration/guides' },
  ],
} as const;
