import { contentWidth } from '@manabandhu/design-system';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Avatar } from '@/modules/shared/ui/Avatar';
import { BrandLogo } from '@/modules/shared/ui/BrandLogo';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { useAppearance } from '@/theme/ThemeProvider';
import { UnreadNotificationDot } from '../UnreadNotificationDot';
import { primaryTabs } from './tabs';
import { useTabPress } from './useTabPress';

/** Desktop web and landscape-tablet navigation: brand, primary links, search, notifications, and account. */
export function TopNav(props: BottomTabBarProps) {
  const { palette } = useAppearance();
  const press = useTabPress(props);
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
        gap="$x6"
        height={68}
        maxWidth={contentWidth.wide}
        paddingHorizontal="$x6"
        width="100%"
      >
        <YStack aria-label="ManaBandhu home" cursor="pointer" onPress={() => press('home')}>
          <BrandLogo size={36} variant="wordmark" />
        </YStack>
        <XStack role="tablist" flex={1} gap="$x1">
          {primaryTabs.map((tab) => {
            const selected = tab.name === active;
            return (
              <XStack
                aria-label={tab.label}
                role="tab"
                aria-selected={selected}
                alignItems="center"
                backgroundColor={selected ? '$primaryTint' : 'transparent'}
                borderRadius="$pill"
                cursor="pointer"
                focusable
                focusVisibleStyle={{
                  outlineWidth: 3,
                  outlineStyle: 'solid',
                  outlineColor: '$outlineColor',
                }}
                gap="$x2"
                hoverStyle={{ backgroundColor: '$surfaceContainerLow' }}
                key={tab.name}
                minHeight="$touch"
                onPress={() => press(tab.name)}
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
                  {tab.label}
                </AppText>
              </XStack>
            );
          })}
        </XStack>
        <XStack
          aria-label="Search ManaBandhu"
          role="button"
          alignItems="center"
          backgroundColor="$surfaceContainerLow"
          borderColor="$borderColor"
          borderRadius="$pill"
          borderWidth={1}
          cursor="pointer"
          gap="$x2"
          height={40}
          hoverStyle={{ borderColor: '$primary' }}
          onPress={() => router.push('/search')}
          paddingHorizontal="$x4"
          width={220}
        >
          <AppIcon color={palette.muted} name="search" size={16} />
          <AppText numberOfLines={1} tone="muted" variant="caption">
            Search rooms, rides, jobs…
          </AppText>
        </XStack>
        <IconButton
          badge={<UnreadNotificationDot />}
          icon="bell"
          label="Open notifications"
          onPress={() => router.push('/notifications')}
        />
        <YStack
          aria-label="Open profile"
          role="button"
          cursor="pointer"
          onPress={() => press('profile')}
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
