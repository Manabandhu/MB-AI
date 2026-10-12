import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { YStack } from 'tamagui';
import { useT } from '@/i18n';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BrandMark } from '@/modules/shared/ui/BrandLogo';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useAppearance } from '@/theme/ThemeProvider';
import { UnreadNotificationDot } from '../UnreadNotificationDot';
import { TabBadge } from './TabBadge';
import { primaryTabs } from './tabs';
import { useTabLabels } from './useChatUnread';
import { useTabPress } from './useTabPress';

/** Tablet and foldable navigation: a vertical rail on the leading edge (Material navigation-rail pattern). */
export function NavRail(props: BottomTabBarProps) {
  const { palette } = useAppearance();
  const press = useTabPress(props);
  const t = useT();
  const labelFor = useTabLabels();
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
        const { label, count, a11yLabel } = labelFor(tab.name);
        return (
          <YStack
            aria-label={a11yLabel}
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
            minHeight="$touch"
            onPress={() => press(tab.name)}
            {...keyboardPress(() => press(tab.name))}
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
              <YStack position="relative">
                <AppIcon
                  color={selected ? palette.primary : palette.muted}
                  name={tab.icon}
                  size={22}
                />
                <TabBadge count={count} />
              </YStack>
            </YStack>
            <AppText
              color={selected ? '$primary' : '$colorMuted'}
              fontSize={12}
              fontWeight={selected ? '800' : '600'}
            >
              {label}
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
