import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { YStack } from 'tamagui';
import { useT } from '@/i18n';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BrandMark } from '@/modules/shared/ui/BrandLogo';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { useAppearance } from '@/theme/ThemeProvider';
import { UnreadNotificationDot } from '../UnreadNotificationDot';
import { primaryTabs } from './tabs';
import { useTabPress } from './useTabPress';

/** Tablet and foldable navigation: a vertical rail on the leading edge (Material navigation-rail pattern). */
export function NavRail(props: BottomTabBarProps) {
  const { palette } = useAppearance();
  const press = useTabPress(props);
  const t = useT();
  const active = props.state.routes[props.state.index]?.name;
  return (
    <YStack
      role="tablist"
      alignItems="center"
      backgroundColor="$surface"
      borderRightColor="$borderColor"
      borderRightWidth={1}
      gap="$x2"
      paddingBottom={Math.max(props.insets.bottom, 16)}
      paddingTop={props.insets.top + 16}
      width={88}
    >
      <YStack marginBottom="$x4">
        <BrandMark size={40} />
      </YStack>
      {primaryTabs.map((tab) => {
        const selected = tab.name === active;
        return (
          <YStack
            aria-label={t(`tabs.${tab.name}`)}
            role="tab"
            aria-selected={selected}
            alignItems="center"
            cursor="pointer"
            focusable
            focusVisibleStyle={{
              outlineWidth: 3,
              outlineStyle: 'solid',
              outlineColor: '$outlineColor',
            }}
            gap={4}
            key={tab.name}
            onPress={() => press(tab.name)}
            paddingVertical="$x2"
            width={80}
          >
            <YStack
              alignItems="center"
              backgroundColor={selected ? '$primaryTint' : 'transparent'}
              borderRadius="$pill"
              hoverStyle={{ backgroundColor: '$surfaceContainerLow' }}
              paddingHorizontal="$x4"
              paddingVertical={6}
            >
              <AppIcon
                color={selected ? palette.primary : palette.muted}
                name={tab.icon}
                size={22}
              />
            </YStack>
            <AppText
              color={selected ? '$primary' : '$colorMuted'}
              fontSize={12}
              fontWeight={selected ? '800' : '600'}
            >
              {t(`tabs.${tab.name}`)}
            </AppText>
          </YStack>
        );
      })}
      <YStack flex={1} />
      <IconButton
        badge={<UnreadNotificationDot />}
        icon="bell"
        label={t('shell.notifications')}
        onPress={() => router.push('/notifications')}
      />
      <IconButton
        icon="settings"
        label={t('shell.settings')}
        onPress={() => router.push('/settings')}
        variant="plain"
      />
    </YStack>
  );
}
