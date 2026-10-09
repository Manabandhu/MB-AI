import { space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { Link, router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/authStore';
import {
  getChatShell,
  getCommunityShell,
  getExploreShell,
  getHomeShell,
  getProfileShell,
  type HomeShellData,
} from '@/modules/foundation/homeApi';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { Avatar, AvatarFallbackText } from '@/modules/shared/ui/gluestack/avatar';
import { ChatShell } from './ChatShell';
import { CommunityShell } from './CommunityShell';
import { UnreadNotificationDot } from './components';
import { ExploreShell } from './ExploreShell';
import { HomeShell } from './HomeShell';
import { ProfileShell } from './ProfileShell';
import { colors, s } from './theme';

type ShellKind = 'home' | 'chat' | 'explore' | 'community' | 'profile';

const tabs = [
  { key: 'home', label: 'Home', route: '/home', icon: 'home' as AppIconName },
  { key: 'community', label: 'Community', route: '/community', icon: 'community' as AppIconName },
  { key: 'explore', label: 'Explore', route: '/explore', icon: 'compass' as AppIconName },
  { key: 'chat', label: 'Chat', route: '/chat', icon: 'message' as AppIconName },
  { key: 'profile', label: 'Profile', route: '/profile', icon: 'user' as AppIconName },
] as const;

const shellApi: Record<ShellKind, () => Promise<HomeShellData>> = {
  home: getHomeShell,
  chat: getChatShell,
  explore: getExploreShell,
  community: getCommunityShell,
  profile: getProfileShell,
};

/** Shows the bell dot only when the inbox has unread items; nothing while loading or on error. */

// ─── Root shell ───────────────────────────────────────────────────────────────

export function AppShellScreen({ kind }: { kind: ShellKind }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['foundation', 'shell', kind],
    queryFn: shellApi[kind],
  });

  const user = useAuthStore((s) => s.user);
  const displayName = user?.user_metadata?.full_name ?? data?.greetingName ?? 'friend';
  const avatarInitial = (displayName?.[0] ?? 'U').toUpperCase();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  return (
    <View style={s.safe}>
      {/* Top bar header - strictly on desktop */}
      {isDesktop && (
        <View style={[s.header, s.headerDesktop]}>
          <View style={s.headerLeft}>
            <View style={s.logoMark}>
              <Text style={s.logoText}>M</Text>
            </View>
            <Text style={s.brandName}>ManaBandhu</Text>
          </View>

          <View style={s.desktopNav}>
            {tabs.map((tab) => (
              <Link key={tab.key} href={tab.route as Href} asChild>
                <Pressable style={s.desktopNavLink}>
                  <Text style={[s.desktopNavText, tab.key === kind && s.desktopNavActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>

          <View style={s.headerRight}>
            <Pressable
              accessibilityLabel="Open notifications"
              accessibilityRole="button"
              onPress={() => router.push('/notifications')}
              style={s.headerIconBtn}
            >
              <AppIcon color={colors.appPrimary} name="bell" size={18} />
              <UnreadNotificationDot />
            </Pressable>
            <Pressable
              accessibilityLabel="Go to profile"
              accessibilityRole="button"
              onPress={() => router.push('/profile' as Href)}
            >
              <Avatar className="h-9 w-9 bg-primary">
                <AvatarFallbackText className="text-primary-foreground text-sm font-bold">
                  {avatarInitial}
                </AvatarFallbackText>
              </Avatar>
            </Pressable>
          </View>
        </View>
      )}

      {/* Scrollable content */}
      {isLoading ? (
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <LoadingState />
        </View>
      ) : isError || !data ? (
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <ErrorState
            title="Unable to load content"
            body="Please check your connection and try again."
            retryLabel="Retry"
            onRetry={() => refetch()}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            s.content,
            {
              paddingTop: !isDesktop ? Math.max(insets.top, 12) + 6 : space.x6,
              paddingBottom: !isDesktop ? (insets.bottom > 0 ? insets.bottom : 8) + 60 : 40,
            },
            isDesktop && s.contentDesktop,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.appPrimary}
              colors={[colors.appPrimary]}
            />
          }
        >
          {kind === 'home' && (
            <HomeShell
              data={data}
              displayName={displayName}
              avatarInitial={avatarInitial}
              isDesktop={isDesktop}
            />
          )}
          {kind === 'explore' && <ExploreShell data={data} isDesktop={isDesktop} />}
          {kind === 'chat' && <ChatShell data={data} isDesktop={isDesktop} />}
          {kind === 'community' && <CommunityShell data={data} isDesktop={isDesktop} />}
          {kind === 'profile' && (
            <ProfileShell data={data} displayName={displayName} isDesktop={isDesktop} />
          )}
        </ScrollView>
      )}

      {/* Bottom tab bar - touches the whole screen edge-to-edge without gaps */}
      {!isDesktop ? (
        <View
          style={[
            s.tabBarEdgeToEdge,
            {
              paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            },
          ]}
        >
          {tabs.map((tab) => {
            const active = tab.key === kind;
            return (
              <Link key={tab.key} href={tab.route as Href} asChild>
                <Pressable
                  style={s.tab}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  {active ? <View style={s.tabPill} /> : null}
                  <AppIcon
                    color={active ? colors.appPrimary : colors.muted}
                    name={tab.icon}
                    size={22}
                  />
                  <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// ─── Quick actions data ───────────────────────────────────────────────────────
