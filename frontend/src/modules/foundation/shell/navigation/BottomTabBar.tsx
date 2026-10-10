import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { useAppearance } from '@/theme/ThemeProvider';
import { primaryTabs } from './tabs';
import { useTabPress } from './useTabPress';

/** Phone navigation: five tabs pinned to the bottom edge, above the home indicator. */
export function BottomTabBar(props: BottomTabBarProps) {
  const { palette, reduceMotion } = useAppearance();
  const press = useTabPress(props);
  const t = useT();
  const active = props.state.routes[props.state.index]?.name;
  return (
    <XStack
      role="tablist"
      backgroundColor="$surface"
      borderTopColor="$borderColor"
      borderTopWidth={1}
      paddingBottom={Math.max(props.insets.bottom, 8)}
      paddingHorizontal="$x2"
      paddingTop="$x2"
    >
      {primaryTabs.map((tab) => {
        const selected = tab.name === active;
        return (
          <YStack
            aria-label={t(`tabs.${tab.name}`)}
            role="tab"
            aria-selected={selected}
            alignItems="center"
            flex={1}
            gap={2}
            key={tab.name}
            minHeight="$touch"
            onPress={() => press(tab.name)}
            pressStyle={{ opacity: 0.7 }}
          >
            <YStack
              alignItems="center"
              backgroundColor={selected ? '$primaryTint' : 'transparent'}
              borderRadius="$pill"
              justifyContent="center"
              paddingHorizontal="$x4"
              paddingVertical={4}
              scale={selected && !reduceMotion ? 1.04 : 1}
              transition={reduceMotion ? null : 'quick'}
            >
              <AppIcon
                color={selected ? palette.primary : palette.muted}
                name={tab.icon}
                size={22}
                strokeWidth={selected ? 2.4 : 2}
              />
            </YStack>
            <AppText
              color={selected ? '$primary' : '$colorMuted'}
              fontSize={11}
              fontWeight={selected ? '800' : '600'}
              numberOfLines={1}
            >
              {t(`tabs.${tab.name}`)}
            </AppText>
          </YStack>
        );
      })}
    </XStack>
  );
}
