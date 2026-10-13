import { type Href, router } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { useRankedModules, useUserActivityStore } from '@/modules/foundation/userActivityStore';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { useAppearance } from '@/theme/ThemeProvider';

const toneColor = { primary: 'primary', teal: 'teal', warm: 'warm', danger: 'error' } as const;
const toneBg = {
  primary: '$primaryTint',
  teal: '$tealTint',
  warm: '$warmTint',
  danger: '$errorBg',
} as const;

/** Six useful destinations with readable labels, ordered by real device-local usage. */
export function QuickAccess() {
  const modules = useRankedModules(6);
  const recordVisit = useUserActivityStore((state) => state.recordModuleVisit);
  const { palette } = useAppearance();
  return (
    <ResponsiveGrid columns={{ compact: 2, medium: 3, expanded: 3, wide: 3 }} gap={12}>
      {modules.map((module) => (
        <Card
          key={module.key}
          aria-label={`${module.label}. ${module.summary}`}
          href={module.route}
          padding="$x3"
          onPress={() => {
            recordVisit(module.key);
            router.push(module.route as Href);
          }}
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack
              backgroundColor={toneBg[module.tone]}
              borderRadius="$control"
              padding="$x3"
              alignSelf="flex-start"
            >
              <AppIcon name={module.icon} color={palette[toneColor[module.tone]]} size={22} />
            </YStack>
            <AppIcon name="arrow-right" color={palette.muted} size={16} />
          </XStack>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {module.label}
          </AppText>
          <AppText tone="muted" variant="caption" numberOfLines={2}>
            {module.summary}
          </AppText>
        </Card>
      ))}
    </ResponsiveGrid>
  );
}
