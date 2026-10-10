import type { User } from '@supabase/supabase-js';
import Head from 'expo-router/head';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { useAuthStore } from '@/lib/authStore';
import { NicknameSheet } from '@/modules/foundation/home/NicknameSheet';
import { AppearanceSettings } from '@/modules/foundation/settings/AppearanceSettings';
import { AppButton } from '@/modules/shared/ui/AppButton';
import type { AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Avatar } from '@/modules/shared/ui/Avatar';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { ListRow } from '@/modules/shared/ui/ListRow';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { Section } from '@/modules/shared/ui/Section';
import { TabHeader } from '../TabHeader';

/** Trust badges only for facts the auth provider records (confirmed email or phone). */
function badgesFor(user: User | null): { label: string; icon: AppIconName }[] {
  const badges: { label: string; icon: AppIconName }[] = [];
  if (user?.email_confirmed_at) badges.push({ label: 'Email verified', icon: 'mail' });
  if (user?.phone_confirmed_at) badges.push({ label: 'Phone verified', icon: 'phone' });
  return badges;
}

const activityLinks = [
  { label: 'My room listings', icon: 'bed', route: '/rooms/my-listings' },
  { label: 'My rides', icon: 'car', route: '/rides/mine' },
  { label: 'Saved items', icon: 'bookmark', route: '/saved' },
  { label: 'My referrals', icon: 'handshake', route: '/referrals/mine' },
  { label: 'My events', icon: 'calendar', route: '/events/mine' },
] as const satisfies readonly { label: string; icon: AppIconName; route: string }[];

const accountLinks = [
  { label: 'Account settings', icon: 'settings', route: '/settings' },
  { label: 'Notification settings', icon: 'bell', route: '/notifications/settings' },
  { label: 'Safety center', icon: 'shield', route: '/safety' },
  { label: 'Blocked users', icon: 'lock', route: '/safety/blocked-users' },
] as const satisfies readonly { label: string; icon: AppIconName; route: string }[];

export function ProfileTab() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? 'Member';
  const contact = user?.email ?? user?.phone ?? null;
  const badges = badgesFor(user);
  const nickname =
    typeof user?.user_metadata?.nickname === 'string' ? user.user_metadata.nickname : null;
  const [nicknameOpen, setNicknameOpen] = useState(false);

  return (
    <Screen>
      <Head>
        <title>Profile · ManaBandhu</title>
      </Head>
      <TabHeader title={t('tabs.profile')} />
      <Card variant="elevated">
        <XStack alignItems="center" gap="$x4">
          <Avatar
            imageUrl={user?.user_metadata?.avatar_url as string | undefined}
            name={name}
            size="xl"
          />
          <YStack flex={1} gap="$x1">
            <AppText variant="h3">{name}</AppText>
            {contact ? <AppText tone="muted">{contact}</AppText> : null}
            <XStack
              alignItems="center"
              alignSelf="flex-start"
              aria-label={t('nickname.row')}
              cursor="pointer"
              gap="$x1"
              minHeight={32}
              onPress={() => setNicknameOpen(true)}
              role="button"
            >
              <AppText tone="muted" variant="caption">
                {t('nickname.row')}:
              </AppText>
              <AppText tone="primary" variant="label">
                {nickname ?? t('nickname.notSet')}
              </AppText>
            </XStack>
            {badges.length > 0 ? (
              <XStack flexWrap="wrap" gap="$x2" marginTop="$x1">
                {badges.map((badge) => (
                  <Chip icon={badge.icon} key={badge.label} label={badge.label} />
                ))}
              </XStack>
            ) : null}
          </YStack>
        </XStack>
      </Card>
      <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2, wide: 3 }}>
        <Section title={t('profile.activity')}>
          <YStack gap="$x2">
            {activityLinks.map((link) => (
              <ListRow href={link.route} icon={link.icon} key={link.label} title={link.label} />
            ))}
          </YStack>
        </Section>
        <Section title={t('profile.account')}>
          <YStack gap="$x2">
            {accountLinks.map((link) => (
              <ListRow
                href={link.route}
                icon={link.icon}
                key={link.label}
                title={link.label}
                tone="teal"
              />
            ))}
          </YStack>
        </Section>
        <Section title={t('appearance.title')}>
          <Card>
            <AppearanceSettings />
          </Card>
        </Section>
      </ResponsiveGrid>
      <AppButton
        icon="logout"
        label={t('profile.signOut')}
        onPress={() => useAuthStore.getState().signOut()}
        variant="ghost"
      />
    </Screen>
  );
}
