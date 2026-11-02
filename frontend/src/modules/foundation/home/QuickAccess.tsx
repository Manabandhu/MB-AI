import { brand, categoryFor, motion } from '@manabandhu/design-system';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import {
  useRankedModules,
  useUserActivityStore,
} from '@/modules/foundation/stores/userActivityStore';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { GradientSurface } from '@/modules/shared/ui/GradientSurface';
import { FadeIn } from '@/modules/shared/ui/motion/FadeIn';
import { PressableScale } from '@/modules/shared/ui/motion/PressableScale';
import { useAdaptiveLayout } from '@/platform/adaptive';

const TILE = 58;

/**
 * Launcher tiles ordered by this member's own usage (stored on the device only). Each module has its own gradient
 * from the design-system `category` tokens; tiles pop in one after another and spring on press.
 */
export function QuickAccess() {
  const { windowClass } = useAdaptiveLayout();
  const perRow = windowClass === 'compact' ? 4 : windowClass === 'medium' ? 6 : 8;
  const modules = useRankedModules(perRow * (windowClass === 'compact' ? 2 : 1));
  const recordVisit = useUserActivityStore((s) => s.recordModuleVisit);
  const open = (module: (typeof modules)[number]) => {
    recordVisit(module.key);
    router.push(module.route as Href);
  };
  return (
    <XStack role="menu" flexWrap="wrap" marginHorizontal={-4} rowGap="$x4">
      {modules.map((module, index) => {
        const colors = categoryFor(module.key);
        return (
          <YStack key={module.key} paddingHorizontal={4} width={`${100 / perRow}%`}>
            <FadeIn index={index}>
              <PressableScale
                aria-label={`${module.label}. ${module.summary}`}
                onPress={() => open(module)}
                role="menuitem"
                scaleTo={motion.pressScaleDeep}
                style={{ alignItems: 'center', gap: 8, borderRadius: 16 }}
              >
                <YStack
                  borderRadius={20}
                  elevation={4}
                  shadowColor={colors.from}
                  shadowOffset={{ width: 0, height: 6 }}
                  shadowOpacity={0.35}
                  shadowRadius={12}
                >
                  <GradientSurface colors={[colors.from, colors.to]} padding={0} radius={20}>
                    <YStack alignItems="center" height={TILE} justifyContent="center" width={TILE}>
                      <AppIcon
                        color={brand.color.onPrimary}
                        name={module.icon}
                        size={26}
                        strokeWidth={2.1}
                      />
                    </YStack>
                  </GradientSurface>
                </YStack>
                <AppText center fontSize={12} fontWeight="700" numberOfLines={1}>
                  {module.label}
                </AppText>
              </PressableScale>
            </FadeIn>
          </YStack>
        );
      })}
    </XStack>
  );
}
