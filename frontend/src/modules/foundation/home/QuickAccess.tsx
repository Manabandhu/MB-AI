import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { useRankedModules, useUserActivityStore } from '@/modules/foundation/userActivityStore';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useAdaptiveLayout } from '@/platform/adaptive';
import { useAppearance } from '@/theme/ThemeProvider';

const toneColor = { primary: 'primary', teal: 'teal', warm: 'warm', danger: 'error' } as const;
const toneBg = {
  primary: '$primaryTint',
  teal: '$tealTint',
  warm: '$warmTint',
  danger: '$warmTint',
} as const;

/** Launcher tiles ordered by this member's own usage (stored on the device only). */
export function QuickAccess() {
  const { windowClass } = useAdaptiveLayout();
  const perRow = windowClass === 'compact' ? 4 : windowClass === 'medium' ? 6 : 8;
  const modules = useRankedModules(perRow * (windowClass === 'compact' ? 2 : 1));
  const recordVisit = useUserActivityStore((s) => s.recordModuleVisit);
  const { palette, reduceMotion } = useAppearance();
  const open = (module: (typeof modules)[number]) => {
    recordVisit(module.key);
    router.push(module.route as Href);
  };
  return (
    <XStack role="menu" flexWrap="wrap" marginHorizontal={-4} rowGap="$x3">
      {modules.map((module) => (
        <YStack
          aria-label={`${module.label}. ${module.summary}`}
          role="menuitem"
          alignItems="center"
          borderRadius="$control"
          cursor="pointer"
          focusVisibleStyle={{
            outlineWidth: 3,
            outlineStyle: 'solid',
            outlineColor: '$outlineColor',
          }}
          focusable
          gap="$x2"
          key={module.key}
          onPress={() => open(module)}
          {...keyboardPress(() => open(module))}
          paddingHorizontal={4}
          pressStyle={reduceMotion ? { opacity: 0.7 } : { scale: 0.92 }}
          transition={reduceMotion ? null : 'quick'}
          width={`${100 / perRow}%`}
        >
          <YStack
            alignItems="center"
            backgroundColor={toneBg[module.tone]}
            borderRadius={18}
            height={56}
            hoverStyle={{ y: -2 }}
            justifyContent="center"
            width={56}
          >
            <AppIcon color={palette[toneColor[module.tone]]} name={module.icon} size={24} />
          </YStack>
          <AppText center fontSize={12} fontWeight="700" numberOfLines={1}>
            {module.label}
          </AppText>
        </YStack>
      ))}
    </XStack>
  );
}
