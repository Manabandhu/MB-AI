import { contentWidth } from '@manabandhu/design-system';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { useAuthStore } from '@/lib/authStore';
import { useQuickJump } from '@/modules/foundation/launcher/QuickJump';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Avatar } from '@/modules/shared/ui/Avatar';
import { BrandLogo } from '@/modules/shared/ui/BrandLogo';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useAppearance } from '@/theme/ThemeProvider';
import { UnreadNotificationDot } from '../UnreadNotificationDot';
import { TabBadge } from './TabBadge';
import { primaryTabs } from './tabs';
import { useTabLabels } from './useChatUnread';
import { useTabPress } from './useTabPress';

const focusRing = {
  outlineWidth: 3,
  outlineStyle: 'solid',
  outlineColor: '$outlineColor',
} as const;

/** Desktop web and landscape-tablet navigation: brand, primary links, search, notifications, and account. */
export function TopNav(props: BottomTabBarProps) {
  const { palette } = useAppearance();
  const press = useTabPress(props);
  const t = useT();
  const open = useQuickJump();
  const labelFor = useTabLabels();
  const active = props.state.routes[props.state.index]?.name;
  const user = useAuthStore((s) => s.user);
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? 'Member';
  return (
    <YStack
      backgroundColor="$surface"
      borderBottomColor="$borderColor"
      borderBottomWidth={1}
      paddingTop={props.insets.top}
    >
      <XStack
        alignItems="center"
        alignSelf="center"
        gap="$x3"
        height={68}
        maxWidth={contentWidth.wide}
        paddingHorizontal="$x6"
        width="100%"
      >
        <YStack
          aria-label="ManaBandhu home"
          role="link"
          borderRadius="$control"
          cursor="pointer"
          focusVisibleStyle={focusRing}
          focusable
          justifyContent="center"
          minHeight="$touch"
          onPress={() => press('home')}
          {...keyboardPress(() => press('home'))}
        >
          <BrandLogo size={36} variant="wordmark" />
        </YStack>
        <XStack role="tablist" flex={1} gap="$x1">
          {primaryTabs.map((tab) => {
            const selected = tab.name === active;
            const { label, count, a11yLabel } = labelFor(tab.name);
            return (
              <XStack
                aria-label={a11yLabel}
                role="tab"
                aria-selected={selected}
                alignItems="center"
                backgroundColor={selected ? '$primaryTint' : 'transparent'}
                borderRadius="$pill"
                cursor="pointer"
                focusable
                focusVisibleStyle={focusRing}
                gap="$x2"
                hoverStyle={{ backgroundColor: '$surfaceContainerLow' }}
                key={tab.name}
                minHeight="$touch"
                onPress={() => press(tab.name)}
                {...keyboardPress(() => press(tab.name))}
                paddingHorizontal="$x4"
              >
                <AppIcon
                  color={selected ? palette.primary : palette.muted}
                  name={tab.icon}
                  size={18}
                />
                <AppText
                  color={selected ? '$primary' : '$color'}
                  fontWeight={selected ? '800' : '600'}
                  variant="label"
                >
                  {label}
                </AppText>
                <TabBadge count={count} placement="inline" />
              </XStack>
            );
          })}
        </XStack>
        <XStack
          aria-label="Jump to a feature. Control or Command K"
          role="button"
          alignItems="center"
          backgroundColor="$surfaceContainerLow"
          borderColor="$borderColor"
          borderRadius="$pill"
          borderWidth={1}
          cursor="pointer"
          focusVisibleStyle={focusRing}
          focusable
          gap="$x2"
          height="$touch"
          hoverStyle={{ borderColor: '$primary' }}
          onPress={open}
          {...keyboardPress(open)}
          paddingHorizontal="$x4"
          flexShrink={1}
          minWidth={44}
          maxWidth={180}
        >
          <AppIcon color={palette.muted} name="search" size={16} />
          <AppText numberOfLines={1} tone="muted" variant="caption">
            {t('navigation.jump')}…
          </AppText>
        </XStack>
        <IconButton
          badge={<UnreadNotificationDot />}
          icon="bell"
          label={t('shell.notifications')}
          onPress={() => router.push('/notifications')}
        />
        <YStack
          aria-label={t('shell.openProfile')}
          role="button"
          alignItems="center"
          borderRadius="$pill"
          cursor="pointer"
          focusVisibleStyle={focusRing}
          focusable
          justifyContent="center"
          minHeight="$touch"
          minWidth="$touch"
          onPress={() => press('profile')}
          {...keyboardPress(() => press('profile'))}
        >
          <Avatar
            name={name}
            imageUrl={user?.user_metadata?.avatar_url as string | undefined}
            size="md"
          />
        </YStack>
      </XStack>
    </YStack>
  );
}
