import { color as baseColors, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { Link, router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/authStore';
import {
  getChatShell,
  getCommunityShell,
  getExploreShell,
  getHomeShell,
  getProfileShell,
  type HomeShellData,
} from '@/modules/foundation/homeApi';
import { homeShellFallbacks } from '@/modules/foundation/homeShellFallbacks';
import { welcomeLogo } from '@/modules/foundation/welcomeAssets';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { Avatar, AvatarFallbackText } from '@/modules/shared/ui/gluestack/avatar';

const colors = {
  ...baseColors,
  appPrimary: '#2c0096',
  primaryContainer: '#5b3fd6',
  surfaceContainer: '#eaedff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainerHigh: '#e2e7ff',
  appShellSurface: '#efedf4',
  warm: '#ff7e33',
};

type ShellKind = 'home' | 'chat' | 'explore' | 'community' | 'profile';

const tabs = [
  { key: 'home', label: 'Home', route: '/home', shortLabel: 'Home', icon: 'home' as AppIconName },
  {
    key: 'explore',
    label: 'Explore',
    route: '/explore',
    shortLabel: 'Explore',
    icon: 'compass' as AppIconName,
  },
  {
    key: 'chat',
    label: 'Chat',
    route: '/chat',
    shortLabel: 'Chat',
    icon: 'message' as AppIconName,
  },
  {
    key: 'community',
    label: 'Community',
    route: '/community',
    shortLabel: 'Community',
    icon: 'community' as AppIconName,
  },
  {
    key: 'profile',
    label: 'Profile',
    route: '/profile',
    shortLabel: 'Profile',
    icon: 'user' as AppIconName,
  },
] as const;

const shellApi: Record<ShellKind, () => Promise<HomeShellData>> = {
  home: getHomeShell,
  chat: getChatShell,
  explore: getExploreShell,
  community: getCommunityShell,
  profile: getProfileShell,
};

export function StitchAppShellScreen({ kind }: { kind: ShellKind }) {
  const { data } = useQuery({
    queryKey: ['foundation', 'shell', kind],
    queryFn: shellApi[kind],
    placeholderData: homeShellFallbacks[kind],
    retry: false,
  });
  const shellData = data ?? homeShellFallbacks[kind];

  const user = useAuthStore((s) => s.user);
  const displayName = user?.user_metadata?.full_name ?? shellData.greetingName;
  const avatarInitial = (displayName?.[0] ?? 'U').toUpperCase();

  return (
    <SafeAreaView style={styles.shellSafe}>
      <View style={styles.shellHeader}>
        <View style={styles.brandRow}>
          <Image source={welcomeLogo} style={styles.headerLogo} />
          <Text style={styles.shellTitle}>{titleCase(kind)}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="Open notifications"
            accessibilityRole="button"
            onPress={() => router.push('/notifications')}
            style={styles.headerIconButton}
          >
            <AppIcon color={colors.primary} name="bell" size={20} />
          </Pressable>
          <Avatar className="h-8 w-8 bg-primary">
            <AvatarFallbackText className="text-primary-foreground">
              {avatarInitial}
            </AvatarFallbackText>
          </Avatar>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.shellContent}>
        {kind === 'home' ? <HomeShell data={shellData} displayName={displayName} /> : null}
        {kind === 'chat' ? <ChatShell data={shellData} /> : null}
        {kind === 'explore' ? <ExploreShell data={shellData} /> : null}
        {kind === 'community' ? <CommunityShell data={shellData} /> : null}
        {kind === 'profile' ? <ProfileShell data={shellData} /> : null}
      </ScrollView>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Link key={tab.key} href={tab.route as Href} asChild>
            <Pressable style={styles.tab}>
              <AppIcon
                color={tab.key === kind ? colors.appPrimary : colors.muted}
                name={tab.icon}
                size={20}
              />
              <Text
                style={StyleSheet.flatten([styles.tabLabel, tab.key === kind && styles.tabActive])}
              >
                {tab.shortLabel}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </SafeAreaView>
  );
}

export function HomeShell({ data, displayName }: { data: HomeShellData; displayName: string }) {
  return (
    <>
      <View style={styles.heroBlock}>
        <Text style={styles.display}>Hello, {displayName}! 👋</Text>
        <Text style={styles.lead}>{data.subtitle}</Text>
      </View>
      <View style={styles.metricsRow}>
        {data.metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.bentoGrid}>
        <Link href="/rooms" asChild>
          <Pressable style={styles.largeAction}>
            <AppIcon color="#d7cfff" name="bed" size={24} />
            <Text style={styles.largeActionTitle}>Find a Room</Text>
            <Text style={styles.largeActionBody}>Browse shared spaces & apartments</Text>
          </Pressable>
        </Link>
        <MiniAction icon="car" label="Offer a Ride" route="/rides/offer" />
        <MiniAction icon="help" label="Ask a Question" route="/community" />
      </View>
      <SectionTitle title="For You" />
      {data.feed.map((item) => (
        <FeedItem
          key={item.id}
          icon={feedIconFor(item.kind)}
          title={item.title}
          body={item.body}
          meta={item.meta}
        />
      ))}
    </>
  );
}

export function ChatShell({ data }: { data: HomeShellData }) {
  return (
    <>
      <View style={styles.searchBox}>
        <AppIcon color={colors.muted} name="search" size={18} />
        <Text style={styles.muted}>Search conversations</Text>
      </View>
      <View style={styles.segmentRow}>
        {['All', 'Groups', 'Support'].map((item, index) => (
          <Text
            key={item}
            style={StyleSheet.flatten([styles.segment, index === 0 && styles.segmentActive])}
          >
            {item}
          </Text>
        ))}
      </View>
      <View style={styles.metricsRow}>
        {data.metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>
      {data.feed.map((item) => (
        <FeedItem
          key={item.id}
          icon="message"
          title={item.title}
          body={item.body}
          meta={item.meta}
        />
      ))}
    </>
  );
}

export function ExploreShell({ data }: { data: HomeShellData }) {
  return (
    <>
      <View style={styles.searchBox}>
        <AppIcon color={colors.muted} name="search" size={18} />
        <Text style={styles.muted}>Search services, communities, and support</Text>
      </View>

      <View style={styles.quickRail}>
        <SuperTile featured icon="home" label="Rooms" route="/rooms" />
        <SuperTile featured icon="car" label="Rides" route="/rides" />
        <SuperTile featured icon="briefcase" label="Jobs" route="/jobs" />
        <SuperTile featured icon="message" label="Chat" route="/chat" />
      </View>

      <ServiceGroup
        title="Daily Needs"
        items={[
          { icon: 'home', label: 'Rooms', route: '/rooms' },
          { icon: 'car', label: 'Rides', route: '/rides' },
          { icon: 'wrench', label: 'Services', route: '/search' },
          { icon: 'package', label: 'Packages', route: '/search' },
        ]}
      />
      <ServiceGroup
        title="Community"
        items={[
          { icon: 'community', label: 'Groups', route: '/community' },
          { icon: 'message', label: 'Chat', route: '/chat' },
          { icon: 'calendar', label: 'Events', route: '/search' },
          { icon: 'shield', label: 'Safety', route: '/search' },
        ]}
      />
      <ServiceGroup
        title="Growth"
        items={[
          { icon: 'briefcase', label: 'Jobs', route: '/search' },
          { icon: 'verified-user', label: 'Referrals', route: '/search' },
          { icon: 'book', label: 'Immigration', route: '/search' },
          { icon: 'wallet', label: 'Expenses', route: '/search' },
        ]}
      />
      <ServiceGroup
        title="Marketplace"
        items={[
          { icon: 'marketplace', label: 'Buy & Sell', route: '/search' },
          { icon: 'map', label: 'Nearby', route: '/search' },
          { icon: 'delivery', label: 'Delivery', route: '/search' },
          { icon: 'plus', label: 'Post', route: '/community' },
        ]}
      />

      <SectionTitle title="For You" />
      <View style={styles.metricsRow}>
        {data.metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>
      {data.feed.map((item) => (
        <FeedItem
          key={item.id}
          icon={feedIconFor(item.kind)}
          title={item.title}
          body={item.body}
          meta={item.meta}
        />
      ))}
    </>
  );
}

export function CommunityShell({ data }: { data: HomeShellData }) {
  return (
    <>
      <View style={styles.searchBox}>
        <AppIcon color={colors.muted} name="search" size={18} />
        <Text style={styles.muted}>Search communities</Text>
      </View>
      <View style={styles.segmentRow}>
        {['All', 'Tech & Career', 'Culture', 'Sports'].map((item, index) => (
          <Text
            key={item}
            style={StyleSheet.flatten([styles.segment, index === 0 && styles.segmentActive])}
          >
            {item}
          </Text>
        ))}
      </View>
      <SectionTitle title="Your Hubs" />
      <View style={styles.metricsRow}>
        {data.metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>
      {data.feed.map((item) => (
        <FeedItem
          key={item.id}
          icon={feedIconFor(item.kind)}
          title={item.title}
          body={item.body}
          meta={item.meta}
        />
      ))}
    </>
  );
}

export function ProfileShell({ data }: { data: HomeShellData }) {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.user_metadata?.full_name ?? data.greetingName;
  const avatarInitial = (displayName?.[0] ?? 'U').toUpperCase();

  return (
    <>
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{avatarInitial}</Text>
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.lead}>ManaBandhu member</Text>
      </View>
      <View style={styles.statRow}>
        {data.metrics.map((metric) => (
          <Stat key={metric.label} value={metric.value} label={metric.label} />
        ))}
      </View>
      {data.feed.map((item) => (
        <FeedItem
          key={item.id}
          icon="chevron-right"
          title={item.title}
          body={item.body}
          meta={item.meta}
        />
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={() => useAuthStore.getState().signOut()}
        style={styles.logOutRow}
      >
        <AppIcon color={colors.warm} name="logout" size={20} />
        <Text style={styles.logOutText}>Log Out</Text>
      </Pressable>
    </>
  );
}

export function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export function MiniAction({
  icon,
  label,
  route,
}: {
  icon: AppIconName;
  label: string;
  route: string;
}) {
  return (
    <Link href={route as Href} asChild>
      <Pressable style={styles.miniAction}>
        <AppIcon color={colors.primary} name={icon} size={20} />
        <Text style={styles.miniLabel}>{label}</Text>
      </Pressable>
    </Link>
  );
}

export type ServiceItem = { icon: AppIconName; label: string; route: string };

export function ServiceGroup({ title, items }: { title: string; items: ServiceItem[] }) {
  return (
    <View style={styles.serviceGroup}>
      <View style={styles.serviceGroupHeader}>
        <Text style={styles.serviceGroupTitle}>{title}</Text>
        <Text style={styles.serviceGroupMore}>View all</Text>
      </View>
      <View style={styles.serviceGrid}>
        {items.map((item) => (
          <SuperTile key={`${title}-${item.label}`} {...item} />
        ))}
      </View>
    </View>
  );
}

export function SuperTile({
  icon,
  label,
  route,
  featured = false,
}: ServiceItem & { featured?: boolean }) {
  return (
    <Link href={route as Href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} service`}
        style={StyleSheet.flatten([styles.superTile, featured && styles.superTileFeatured])}
      >
        <View style={StyleSheet.flatten([styles.superIcon, featured && styles.superIconFeatured])}>
          <AppIcon color={featured ? colors.surface : colors.primary} name={icon} size={24} />
        </View>
        <Text style={styles.superLabel}>{label}</Text>
      </Pressable>
    </Link>
  );
}

export function ImageCard({ image, title, meta }: { image: string; title: string; meta: string }) {
  return (
    <View style={styles.imageCard}>
      <Image source={{ uri: image }} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardMeta}>{meta}</Text>
    </View>
  );
}

export function InfoCard({
  title,
  body,
  meta,
  accent = false,
}: {
  title: string;
  body: string;
  meta: string;
  accent?: boolean;
}) {
  return (
    <View style={StyleSheet.flatten([styles.infoCard, accent && styles.infoCardAccent])}>
      <Text style={styles.cardMeta}>{meta}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
    </View>
  );
}

export function FeedItem({
  icon,
  title,
  body,
  meta,
}: {
  icon?: AppIconName;
  title: string;
  body: string;
  meta?: string;
}) {
  return (
    <View style={styles.feedItem}>
      {icon ? (
        <View style={styles.feedIcon}>
          <AppIcon color={colors.primary} name={icon} size={20} />
        </View>
      ) : null}
      <View style={styles.feedCopy}>
        <View style={styles.feedTop}>
          <Text style={styles.feedTitle}>{title}</Text>
          {meta ? <Text style={styles.feedMeta}>{meta}</Text> : null}
        </View>
        <Text style={styles.cardBody}>{body}</Text>
      </View>
    </View>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function feedIconFor(kind: string): AppIconName {
  switch (kind) {
    case 'room':
      return 'home';
    case 'ride':
      return 'car';
    case 'job':
      return 'briefcase';
    case 'event':
      return 'calendar';
    default:
      return 'message';
  }
}

const styles = StyleSheet.create({
  shellSafe: { backgroundColor: colors.background, flex: 1 },
  shellHeader: {
    alignItems: 'center',
    backgroundColor: 'rgba(250,248,255,0.92)',
    flexDirection: 'row',
    height: 64,
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
  },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: space.x2 },
  headerLogo: { borderRadius: 8, height: 32, width: 32 },
  shellTitle: { color: colors.appPrimary, fontSize: 20, fontWeight: '700' },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: space.x3 },
  headerIconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  shellContent: { gap: space.x6, padding: space.x4, paddingBottom: 96 },
  heroBlock: { gap: space.x2 },
  display: { color: colors.ink, fontSize: 36, fontWeight: '800', lineHeight: 44 },
  lead: { color: colors.muted, fontSize: 18, lineHeight: 28 },
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x4 },
  largeAction: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 24,
    flexBasis: '100%',
    gap: space.x3,
    minHeight: 164,
    padding: space.x4,
  },
  largeActionTitle: { color: '#d7cfff', fontSize: 20, fontWeight: '800' },
  largeActionBody: { color: '#d7cfff', fontSize: 14, lineHeight: 20 },
  miniAction: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 20,
    flex: 1,
    gap: space.x2,
    minHeight: 112,
    minWidth: 150,
    padding: space.x3,
  },
  miniLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  quickRail: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: space.x3,
  },
  serviceGroup: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: space.x3,
    padding: space.x4,
  },
  serviceGroupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceGroupTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  serviceGroupMore: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: space.x4,
  },
  superTile: {
    alignItems: 'center',
    flexBasis: '25%',
    gap: space.x2,
    minHeight: 88,
    minWidth: 74,
    paddingHorizontal: space.x1,
  },
  superTileFeatured: { minHeight: 96 },
  superIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  superIconFeatured: { backgroundColor: colors.primary, borderRadius: 20, height: 58, width: 58 },
  superLabel: { color: colors.ink, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  sectionTitle: { color: colors.ink, fontSize: 24, fontWeight: '800', lineHeight: 32 },
  recommendationStrip: { flexDirection: 'row', gap: space.x3 },
  horizontalCards: { flexDirection: 'row', gap: space.x4 },
  imageCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    flex: 1,
    minWidth: 180,
    overflow: 'hidden',
  },
  cardImage: { height: 140, width: '100%' },
  cardTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
    paddingHorizontal: space.x4,
    paddingTop: space.x3,
  },
  cardMeta: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  infoCard: { backgroundColor: colors.surface, borderRadius: 20, gap: space.x2, padding: space.x4 },
  infoCardAccent: { backgroundColor: colors.primarySoft },
  feedItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    gap: space.x3,
    padding: space.x3,
  },
  feedIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  feedCopy: { flex: 1, gap: space.x1 },
  feedTop: { flexDirection: 'row', justifyContent: 'space-between', gap: space.x2 },
  feedTitle: { color: colors.ink, flex: 1, fontSize: 14, fontWeight: '800' },
  feedMeta: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 18,
    flexDirection: 'row',
    gap: space.x2,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: space.x4,
  },
  muted: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
  segment: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 999,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  segmentActive: { backgroundColor: colors.primary, color: colors.surface },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3 },
  profileHero: { alignItems: 'center', gap: space.x2 },
  profileAvatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 52,
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  profileAvatarText: { color: colors.surface, fontSize: 36, fontWeight: '900' },
  profileName: { color: colors.ink, fontSize: 28, fontWeight: '800' },
  profileBio: { color: colors.muted, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  statRow: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: space.x4,
  },
  stat: { alignItems: 'center', gap: space.x1 },
  statValue: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.x3,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: 120,
    padding: space.x3,
  },
  metricValue: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  metricLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  logOutRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x2,
    padding: space.x3,
  },
  logOutText: { color: colors.warm, fontSize: 14, fontWeight: '700' },
  tabBar: {
    backgroundColor: 'rgba(250,248,255,0.96)',
    flexDirection: 'row',
    height: 72,
    paddingHorizontal: space.x2,
  },
  tab: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  tabLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  tabActive: { color: colors.appPrimary },
});
