import { useQuery } from '@tanstack/react-query';
import { getMarketplaceScreen } from '@/modules/marketplace/api';
import { marketplaceScreenFallbacks } from '@/modules/marketplace/marketplaceFallbacks';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

type MarketplaceScreenProps = {
  screenId: keyof typeof marketplaceRoutes;
};

export function MarketplaceScreen({ screenId }: MarketplaceScreenProps) {
  const fallback = marketplaceScreenFallbacks[screenId];
  const screen = useQuery({
    queryKey: ['marketplace', 'screen', screenId],
    queryFn: () => getMarketplaceScreen(screenId),
  });
  const data = screen.data ?? fallback;

  return (
    <FeatureScreen
      actions={marketplaceActions[screenId]}
      cards={data.items}
      currentRoute={marketplaceRoutes[screenId]}
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}

const marketplaceRoutes = {
  home: '/marketplace',
  search: '/marketplace/search',
  categories: '/marketplace/categories',
  saved: '/marketplace/saved',
  sell: '/marketplace/sell',
} as const;

const marketplaceActions = {
  home: [
    { label: 'Search', route: '/marketplace/search' },
    { label: 'Categories', route: '/marketplace/categories' },
    { label: 'Sell item', route: '/marketplace/sell' },
    { label: 'Saved', route: '/marketplace/saved' },
  ],
  search: [
    { label: 'Categories', route: '/marketplace/categories' },
    { label: 'Sell item', route: '/marketplace/sell' },
    { label: 'Saved', route: '/marketplace/saved' },
  ],
  categories: [
    { label: 'Search', route: '/marketplace/search' },
    { label: 'Sell item', route: '/marketplace/sell' },
  ],
  saved: [
    { label: 'Search', route: '/marketplace/search' },
    { label: 'Sell item', route: '/marketplace/sell' },
  ],
  sell: [
    { label: 'Search', route: '/marketplace/search' },
    { label: 'Saved', route: '/marketplace/saved' },
  ],
} as const;
