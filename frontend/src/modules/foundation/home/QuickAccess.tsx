import { type Href, router } from 'expo-router';
import { useRankedModules, useUserActivityStore } from '@/modules/foundation/userActivityStore';
import { discoveryKind } from '@/modules/shared/ui/DiscoveryArtwork';
import { DiscoveryCard } from '@/modules/shared/ui/DiscoveryCard';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';

/** Six simple shortcuts, ordered by actual device-local usage. */
export function QuickAccess() {
  const modules = useRankedModules(6);
  const recordVisit = useUserActivityStore((state) => state.recordModuleVisit);
  return (
    <ResponsiveGrid columns={{ compact: 2, medium: 3, expanded: 3, wide: 3 }} gap={12}>
      {modules.map((module) => (
        <DiscoveryCard
          key={module.key}
          title={module.label}
          description={module.summary}
          href={module.route}
          kind={discoveryKind(module.key)}
          compact
          onPress={() => {
            recordVisit(module.key);
            router.push(module.route as Href);
          }}
        />
      ))}
    </ResponsiveGrid>
  );
}
