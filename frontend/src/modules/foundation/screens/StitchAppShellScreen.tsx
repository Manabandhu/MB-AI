import { color as baseColors, space } from '@manabandhu/design-system';
import type { Href } from 'expo-router';
import { Link, router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export function StitchAppShellScreen({ kind }: { kind: ShellKind }) {
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
            <AvatarFallbackText className="text-primary-foreground">MB</AvatarFallbackText>
          </Avatar>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.shellContent}>
        {kind === 'home' ? <HomeShell /> : null}
        {kind === 'chat' ? <ChatShell /> : null}
        {kind === 'explore' ? <ExploreShell /> : null}
        {kind === 'community' ? <CommunityShell /> : null}
        {kind === 'profile' ? <ProfileShell /> : null}
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
              <Text style={[styles.tabLabel, tab.key === kind && styles.tabActive]}>
                {tab.shortLabel}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </SafeAreaView>
  );
}

export function HomeShell() {
  return (
    <>
      <View style={styles.heroBlock}>
        <Text style={styles.display}>Hello, Surya! 👋</Text>
        <Text style={styles.lead}>Here’s what’s happening in your community today.</Text>
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
      <View style={styles.horizontalCards}>
        <ImageCard
          image="https://lh3.googleusercontent.com/aida-public/AB6AXuAyUigpCMPxDs43S2hib_i5VB-rtt1kfqIu6nV4OVbVDw6Sk6k_U0HN6cLkGfTl-wX6sXPwQFpxrG3hU5_zNOdbA937Us-Rabbtpbo18JBRijXY5bV4wWz0o1qiTB2TNWyosxtqYUJp00_LPQjEqCNo5X2kYuKUhQdT8MNiksIpSHwt37PLgQ-tJh9soFRwHy3KZZhU2GczR1jlFsk2b-ra85_M10W93gACL-P-93_GSY43EUVR5mpa"
          meta="$850/mo"
          title="Sunny room in Downtown"
        />
        <InfoCard
          accent
          title="Tech Meetup & Mixer"
          body="Sat, Oct 14 • 6:00 PM"
          meta="Community Event"
        />
      </View>
      <SectionTitle title="Trending in your area" />
      <FeedItem
        icon="car"
        title="Ride offered to SF"
        body="Driving from SJ to SF this Friday at 5 PM. Have 2 seats available."
      />
      <FeedItem
        icon="message"
        title="Kiran asked a question"
        body="Does anyone know a good, affordable moving service for a 1BHK?"
      />
    </>
  );
}

export function ChatShell() {
  return (
    <>
      <View style={styles.searchBox}>
        <AppIcon color={colors.muted} name="search" size={18} />
        <Text style={styles.muted}>Search conversations</Text>
      </View>
      <View style={styles.segmentRow}>
        {['All', 'Groups', 'Support'].map((item, index) => (
          <Text key={item} style={[styles.segment, index === 0 && styles.segmentActive]}>
            {item}
          </Text>
        ))}
      </View>
      {[
        ['Sarah Jenkins', 'Are we still on for coffee later? ☕️', '10:42 AM'],
        ['Design Team', 'I uploaded the new assets to the drive.', 'Yesterday'],
        ['Marcus Chen', 'Thanks for the help yesterday!', 'Mon'],
        ['Dog Walkers Club', 'Elena: We are meeting at the park at 8am!', 'Sun'],
      ].map(([title, body, time]) => (
        <FeedItem key={title} icon="message" title={title} body={body} meta={time} />
      ))}
    </>
  );
}

export function ExploreShell() {
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
      <View style={styles.recommendationStrip}>
        <InfoCard
          title="Sunny room in Irving"
          body="$850/mo • verified host notes"
          meta="Room match"
        />
        <InfoCard title="Tech meetup tonight" body="Central Library • 6:00 PM" meta="Near you" />
      </View>
    </>
  );
}

export function CommunityShell() {
  return (
    <>
      <View style={styles.searchBox}>
        <AppIcon color={colors.muted} name="search" size={18} />
        <Text style={styles.muted}>Search communities</Text>
      </View>
      <View style={styles.segmentRow}>
        {['All', 'Tech & Career', 'Culture', 'Sports'].map((item, index) => (
          <Text key={item} style={[styles.segment, index === 0 && styles.segmentActive]}>
            {item}
          </Text>
        ))}
      </View>
      <SectionTitle title="Your Hubs" />
      <View style={styles.categoryGrid}>
        <MiniAction icon="community" label="Bay Area Indians" route="/community" />
        <MiniAction icon="message" label="Telugu Techies" route="/community" />
        <MiniAction icon="plus" label="Create Hub" route="/community" />
      </View>
      <SectionTitle title="Activity Feed" />
      <InfoCard
        title="Priya Reddy"
        body="Planning a casual meetup this Saturday at Dolores Park! We'll bring homemade snacks and maybe a frisbee."
        meta="in Bay Area Indians • 2h ago"
      />
    </>
  );
}

export function ProfileShell() {
  return (
    <>
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>A</Text>
        </View>
        <Text style={styles.profileName}>Aria Thompson</Text>
        <Text style={styles.lead}>San Francisco, CA</Text>
        <Text style={styles.profileBio}>
          UX Designer passionate about crafting digital experiences that feel human and engaging.
          Coffee enthusiast.
        </Text>
      </View>
      <View style={styles.statRow}>
        <Stat value="124" label="Posts" />
        <Stat value="892" label="Connections" />
        <Stat value="4.9" label="Helpful" />
      </View>
      {['Account Settings', 'Trust & Safety', 'Help & Support', 'Privacy Policy', 'Log Out'].map(
        (item) => (
          <FeedItem
            key={item}
            icon={
              item === 'Account Settings'
                ? 'user'
                : item === 'Trust & Safety'
                  ? 'shield'
                  : 'chevron-right'
            }
            title={item}
            body={
              item === 'Account Settings'
                ? 'Update profile, email, and password'
                : 'Privacy controls and support'
            }
          />
        ),
      )}
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
        style={[styles.superTile, featured && styles.superTileFeatured]}
      >
        <View style={[styles.superIcon, featured && styles.superIconFeatured]}>
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
    <View style={[styles.infoCard, accent && styles.infoCardAccent]}>
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
