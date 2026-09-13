import { color as baseColors, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
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
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { Avatar, AvatarFallbackText } from '@/modules/shared/ui/gluestack/avatar';

// ─── Colour palette ───────────────────────────────────────────────────────────
const colors = {
  ...baseColors,
  appPrimary: '#431ebe',
  primaryContainer: '#5b3fd6',
  surfaceContainer: '#eaedff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainerHigh: '#e2e7ff',
  warm: '#ff7e33',
  teal: '#00696b',
  tealSoft: 'rgba(0,105,107,0.08)',
  indigoSoft: 'rgba(67,30,190,0.07)',
  orangeSoft: 'rgba(255,126,51,0.10)',
};

// ─── Tab definition ───────────────────────────────────────────────────────────
type ShellKind = 'home' | 'chat' | 'explore' | 'community' | 'profile';

const tabs = [
  { key: 'home', label: 'Home', route: '/home', icon: 'home' as AppIconName },
  { key: 'explore', label: 'Explore', route: '/explore', icon: 'compass' as AppIconName },
  { key: 'chat', label: 'Chat', route: '/chat', icon: 'message' as AppIconName },
  { key: 'community', label: 'Community', route: '/community', icon: 'community' as AppIconName },
  { key: 'profile', label: 'Profile', route: '/profile', icon: 'user' as AppIconName },
] as const;

const shellApi: Record<ShellKind, () => Promise<HomeShellData>> = {
  home: getHomeShell,
  chat: getChatShell,
  explore: getExploreShell,
  community: getCommunityShell,
  profile: getProfileShell,
};

// ─── Root shell ───────────────────────────────────────────────────────────────
export function StitchAppShellScreen({ kind }: { kind: ShellKind }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

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
    <SafeAreaView style={s.safe}>
      {/* Sticky header */}
      <View style={[s.header, isDesktop && s.headerDesktop]}>
        <View style={s.headerLeft}>
          <View style={s.logoMark}><Text style={s.logoText}>M</Text></View>
          {isDesktop ? <Text style={s.brandName}>ManaBandhu</Text> : null}
        </View>

        {isDesktop ? (
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
        ) : null}

        <View style={s.headerRight}>
          <Pressable
            accessibilityLabel="Open notifications"
            accessibilityRole="button"
            onPress={() => router.push('/notifications')}
            style={s.headerIconBtn}
          >
            <AppIcon color={colors.appPrimary} name="bell" size={18} />
            <View style={s.notifDot} />
          </Pressable>
          <Avatar className="h-9 w-9 bg-primary">
            <AvatarFallbackText className="text-primary-foreground text-sm font-bold">
              {avatarInitial}
            </AvatarFallbackText>
          </Avatar>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={[s.content, isDesktop && s.contentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        {kind === 'home' && <HomeShell data={shellData} displayName={displayName} isDesktop={isDesktop} />}
        {kind === 'explore' && <ExploreShell data={shellData} isDesktop={isDesktop} />}
        {kind === 'chat' && <ChatShell data={shellData} isDesktop={isDesktop} />}
        {kind === 'community' && <CommunityShell data={shellData} isDesktop={isDesktop} />}
        {kind === 'profile' && <ProfileShell data={shellData} displayName={displayName} isDesktop={isDesktop} />}
      </ScrollView>

      {/* Bottom tab bar - mobile only */}
      {!isDesktop ? (
        <View style={s.tabBar}>
          {tabs.map((tab) => {
            const active = tab.key === kind;
            return (
              <Link key={tab.key} href={tab.route as Href} asChild>
                <Pressable style={s.tab} accessibilityRole="tab" accessibilityState={{ selected: active }}>
                  {active ? <View style={s.tabPill} /> : null}
                  <AppIcon color={active ? colors.appPrimary : colors.muted} name={tab.icon} size={22} />
                  <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ─── Quick actions data ───────────────────────────────────────────────────────
const quickActions: { icon: AppIconName; label: string; route: string; bg: string; iconColor: string }[] = [
  { icon: 'home', label: 'Rooms', route: '/rooms', bg: '#e8e4fb', iconColor: '#431ebe' },
  { icon: 'car', label: 'Rides', route: '/rides', bg: '#d9f5f5', iconColor: '#00696b' },
  { icon: 'briefcase', label: 'Jobs', route: '/jobs', bg: '#fff0e6', iconColor: '#ff7e33' },
  { icon: 'community', label: 'Community', route: '/community', bg: '#fce8f3', iconColor: '#b5198d' },
  { icon: 'message', label: 'Chat', route: '/chat', bg: '#e4ecff', iconColor: '#2a5be0' },
  { icon: 'calendar', label: 'Events', route: '/search', bg: '#fff4e0', iconColor: '#c97a00' },
  { icon: 'marketplace', label: 'Market', route: '/search', bg: '#e2f9ef', iconColor: '#1a8a5c' },
  { icon: 'shield', label: 'Safety', route: '/search', bg: '#ffeaea', iconColor: '#ba1a1a' },
];

const liveStats = [
  { label: '12.4K Verified Members', color: '#00696b', bg: 'rgba(0,105,107,0.08)', route: '/community' },
  { label: '847 Active Rooms', color: '#431ebe', bg: 'rgba(67,30,190,0.07)', route: '/rooms' },
  { label: '2.1K Carpools', color: '#ff7e33', bg: 'rgba(255,126,51,0.10)', route: '/rides' },
  { label: '580 Open Jobs', color: '#1a8a5c', bg: '#e2f9ef', route: '/jobs' },
];

const sampleRooms = [
  { id: 'r1', title: 'Private Room in Domain', price: '$750/mo', location: 'North Austin', verified: true },
  { id: 'r2', title: '2B2B Shared Apt', price: '$920/mo', location: 'Downtown', verified: true },
  { id: 'r3', title: 'Master Bed w/ Bath', price: '$850/mo', location: 'Round Rock', verified: false },
];

const sampleJobs = [
  { id: 'j1', company: 'G', title: 'Sr. Frontend Engineer', location: 'Austin, TX · Hybrid', bonus: '$1,500' },
  { id: 'j2', company: 'S', title: 'Product Ops Analyst', location: 'Remote · Austin', bonus: '$1,000' },
];

const samplePosts = [
  { id: 'p1', initials: 'AS', name: 'Ananya Sharma', time: '20m ago', group: 'Austin Desi Hub', body: 'Organizing a Diwali potluck at Zilker Park this weekend! All new Austinites welcome 🪔✨', likes: 48, comments: 19 },
  { id: 'p2', initials: 'VP', name: 'Vikram Patel', time: '1h ago', group: 'Carpool & Commute', body: 'Daily carpool from Round Rock to Apple Riata. Leaving 8:15 AM, return 5:30 PM. 2 seats open! 🚗', likes: 24, comments: 8 },
];

// ─── HOME SHELL ───────────────────────────────────────────────────────────────
export function HomeShell({ displayName, isDesktop }: { data: HomeShellData; displayName: string; isDesktop: boolean }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <View style={s.greetRow}>
        <Text style={s.greetText}>{greeting}, {displayName.split(' ')[0]} 👋</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Austin TX Rooms"
          onPress={() => router.push('/rooms' as Href)}
          style={s.locationChip}
        >
          <AppIcon color={colors.appPrimary} name="map" size={12} />
          <Text style={s.locationText}>Austin, TX · 847 Rooms</Text>
          <AppIcon color={colors.appPrimary} name="chevron-right" size={10} />
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search rooms, flatmates, rides"
        onPress={() => router.push('/rooms' as Href)}
        style={s.searchBar}
      >
        <AppIcon color={colors.muted} name="search" size={18} />
        <Text style={s.searchPlaceholder}>Austin, TX · 847 rooms, flatmates, rides...</Text>
      </Pressable>

      <View style={[s.qaGrid, isDesktop && s.qaGridDesktop]}>
        {quickActions.map((qa) => (
          <Link key={qa.label} href={qa.route as Href} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={qa.label}
              style={StyleSheet.flatten([s.qaTile, { backgroundColor: qa.bg }])}
            >
              <AppIcon color={qa.iconColor} name={qa.icon} size={22} />
              <Text style={[s.qaLabel, { color: qa.iconColor }]}>{qa.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillRow}>
        {liveStats.map((stat) => (
          <Pressable
            key={stat.label}
            onPress={() => router.push(stat.route as Href)}
            style={[s.statPill, { backgroundColor: stat.bg }]}
          >
            <View style={[s.statDot, { backgroundColor: stat.color }]} />
            <Text style={[s.statPillText, { color: stat.color }]}>{stat.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Rooms Near You</Text>
        <Link href="/rooms" asChild><Pressable accessibilityRole="link"><Text style={s.seeAll}>See All →</Text></Pressable></Link>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll}>
        {sampleRooms.map((room) => (
          <Pressable key={room.id} style={s.roomCard}>
            <View style={s.roomThumb}><Text style={s.roomThumbEmoji}>🏠</Text></View>
            <View style={s.roomInfo}>
              <Text style={s.roomPrice}>{room.price}</Text>
              <Text style={s.roomTitle} numberOfLines={1}>{room.title}</Text>
              <View style={s.roomMeta}>
                <AppIcon color={colors.muted} name="map" size={11} />
                <Text style={s.roomLocation}>{room.location}</Text>
              </View>
              {room.verified ? (
                <View style={s.verifiedBadge}>
                  <AppIcon color={colors.teal} name="check" size={10} strokeWidth={3} />
                  <Text style={s.verifiedText}>Verified</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Community Feed</Text>
        <Link href="/community" asChild><Pressable accessibilityRole="link"><Text style={s.seeAll}>See All →</Text></Pressable></Link>
      </View>
      {samplePosts.map((post) => <PostCard key={post.id} post={post} />)}

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Hot Job Referrals</Text>
        <Link href="/jobs" asChild><Pressable accessibilityRole="link"><Text style={s.seeAll}>See All →</Text></Pressable></Link>
      </View>
      {sampleJobs.map((job) => <JobRow key={job.id} job={job} />)}
    </>
  );
}

// ─── EXPLORE SHELL ────────────────────────────────────────────────────────────
const exploreCategories = ['All', 'Rooms', 'Rides', 'Jobs', 'Events', 'Community', 'Marketplace', 'Immigration'];

const exploreItems = [
  { id: 'er1', type: 'room', title: '2B2B Shared Apt', sub: '$920/mo · Downtown', badge: 'Verified' },
  { id: 'er2', type: 'room', title: 'Private Room Domain', sub: '$750/mo · North Austin', badge: 'Furnished' },
  { id: 'ej1', type: 'job', title: 'Sr. Engineer', sub: 'Google · Hybrid', badge: '$1.5K Referral' },
  { id: 'ej2', type: 'job', title: 'Data Analyst', sub: 'Tesla · Remote', badge: '$800 Referral' },
  { id: 'ee1', type: 'event', title: 'Diwali Potluck', sub: 'Oct 19 · Zilker Park', badge: '47 Going' },
  { id: 'ee2', type: 'event', title: 'Tech Mixer Austin', sub: 'Oct 25 · WeWork', badge: '120 Going' },
];

export function ExploreShell({ isDesktop }: { data: HomeShellData; isDesktop: boolean }) {
  const [activeCategory, setActiveCategory] = useState('All');

  return (
    <>
      <View style={s.exploreHero}>
        <Text style={s.exploreHeroTitle}>Explore</Text>
        <Text style={s.exploreHeroSub}>Discover Desi communities near you</Text>
      </View>

      <Pressable onPress={() => router.push('/search')} style={s.searchBar}>
        <AppIcon color={colors.muted} name="search" size={18} />
        <Text style={s.searchPlaceholder}>Explore rooms, rides, jobs...</Text>
        <View style={s.filterPill}><AppIcon color={colors.appPrimary} name="wrench" size={14} /></View>
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillRow}>
        {exploreCategories.map((cat) => (
          <Pressable key={cat} onPress={() => setActiveCategory(cat)} style={[s.catChip, activeCategory === cat && s.catChipActive]}>
            <Text style={[s.catChipText, activeCategory === cat && s.catChipTextActive]}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.featuredCard}>
        <View style={s.featuredOverlay}>
          <Text style={s.featuredBadge}>🎉 Featured Event</Text>
          <Text style={s.featuredTitle}>Austin Diwali Mela 2024</Text>
          <Text style={s.featuredSub}>Zilker Park · Oct 19 · 500+ attending</Text>
        </View>
        <Text style={s.featuredEmoji}>🎆</Text>
      </View>

      <View style={[s.exploreGrid, isDesktop && s.exploreGridDesktop]}>
        {exploreItems.map((item) => (
          <Pressable key={item.id} style={s.exploreCard}>
            <View style={[s.exploreCardThumb, { backgroundColor: item.type === 'room' ? colors.indigoSoft : item.type === 'job' ? colors.orangeSoft : colors.tealSoft }]}>
              <Text style={s.exploreCardEmoji}>{item.type === 'room' ? '🏠' : item.type === 'job' ? '💼' : '🎉'}</Text>
            </View>
            <View style={s.exploreCardBody}>
              <Text style={s.exploreCardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={s.exploreCardSub} numberOfLines={1}>{item.sub}</Text>
              <View style={[s.exploreBadge, { backgroundColor: item.type === 'room' ? colors.indigoSoft : item.type === 'job' ? colors.orangeSoft : colors.tealSoft }]}>
                <Text style={[s.exploreBadgeText, { color: item.type === 'room' ? colors.appPrimary : item.type === 'job' ? colors.warm : colors.teal }]}>{item.badge}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </>
  );
}

// ─── CHAT SHELL ───────────────────────────────────────────────────────────────
const sampleConversations = [
  { id: 'c1', initials: 'PS', name: 'Priya Sharma', preview: 'See you at the meetup! 👋', time: '2m', unread: 2, online: true, isGroup: false },
  { id: 'c2', initials: 'AD', name: 'Austin Desi Roommates', preview: 'Kiran: Anyone know a good movers?', time: '15m', unread: 5, online: false, isGroup: true },
  { id: 'c3', initials: 'VP', name: 'Vikram Patel', preview: 'The carpool is confirmed for Friday', time: '1h', unread: 0, online: true, isGroup: false },
  { id: 'c4', initials: 'TJ', name: 'Tech Jobs Referrals', preview: 'New opening at Google Austin!', time: '3h', unread: 1, online: false, isGroup: true },
  { id: 'c5', initials: 'AM', name: 'Ananya M.', preview: 'Thanks for the referral! 🙏', time: 'Yesterday', unread: 0, online: false, isGroup: false },
];

export function ChatShell(_props: { data: HomeShellData; isDesktop: boolean }) {
  return (
    <>
      <View style={s.chatHeader}>
        <Text style={s.chatTitle}>Messages</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="New conversation" onPress={() => router.push('/chat/new')} style={s.composeBtn}>
          <AppIcon color="#fff" name="plus" size={16} />
        </Pressable>
      </View>

      <Pressable onPress={() => {}} style={s.searchBar}>
        <AppIcon color={colors.muted} name="search" size={18} />
        <Text style={s.searchPlaceholder}>Search conversations...</Text>
      </Pressable>

      <View style={s.pinnedRow}>
        <View style={s.pinnedIcon}><AppIcon color={colors.teal} name="shield" size={16} /></View>
        <View style={s.pinnedBody}>
          <Text style={s.pinnedTitle}>ManaBandhu Community Alerts</Text>
          <Text style={s.pinnedSub}>Tap to read important updates</Text>
        </View>
        <AppIcon color={colors.muted} name="chevron-right" size={16} />
      </View>

      <View style={s.convList}>
        <Text style={s.convListHeader}>RECENT</Text>
        {sampleConversations.map((conv) => (
          <Pressable key={conv.id} accessibilityRole="button" onPress={() => router.push('/chat')} style={s.convRow}>
            <View style={s.convAvatarWrap}>
              <View style={[s.convAvatar, conv.isGroup && s.convAvatarGroup]}>
                <Text style={s.convAvatarText}>{conv.initials}</Text>
              </View>
              {conv.online ? <View style={s.onlineDot} /> : null}
            </View>
            <View style={s.convBody}>
              <View style={s.convTop}>
                <Text style={s.convName} numberOfLines={1}>{conv.name}</Text>
                <Text style={s.convTime}>{conv.time}</Text>
              </View>
              <Text style={[s.convPreview, conv.unread > 0 && s.convPreviewUnread]} numberOfLines={1}>{conv.preview}</Text>
            </View>
            {conv.unread > 0 ? (
              <View style={s.unreadBadge}><Text style={s.unreadText}>{conv.unread}</Text></View>
            ) : null}
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => router.push('/chat/new')} style={s.newChatBtn}>
        <AppIcon color={colors.appPrimary} name="plus" size={16} />
        <Text style={s.newChatText}>Start a New Conversation</Text>
      </Pressable>
    </>
  );
}

// ─── COMMUNITY SHELL ──────────────────────────────────────────────────────────
const communityTabs = ['Feed', 'Groups', 'Events', 'My Posts'];
const storyAvatars = [
  { initials: 'AS', bg: '#e8e4fb' }, { initials: 'VP', bg: '#d9f5f5' },
  { initials: 'KR', bg: '#fce8f3' }, { initials: 'SM', bg: '#fff0e6' },
  { initials: 'AK', bg: '#e4ecff' },
];
const trendingTopics = ['#AustinDiwali2024', '#TechLayoffsHelp', '#CarpoolRoundRock', '#NewMembersWelcome'];
const communityFeedPosts = [
  { id: 'cf1', initials: 'AS', name: 'Ananya Sharma', time: '20m ago', group: 'Austin Desi Hub', body: 'Organizing a Diwali potluck at Zilker Park this weekend! All new Austinites welcome 🪔✨', likes: 48, comments: 19 },
  { id: 'cf2', initials: 'VP', name: 'Vikram Patel', time: '1h ago', group: 'Carpool & Commute', body: 'Daily carpool from Round Rock to Apple Riata. Leaving 8:15 AM, return 5:30 PM. 2 seats open! 🚗', likes: 24, comments: 8 },
  { id: 'cf3', initials: 'KR', name: 'Kiran Rao', time: '3h ago', group: 'Tech Referrals', body: 'Senior SDE opening at Google Austin — hybrid, strong team. DM me for referral! 💼', likes: 62, comments: 31 },
];

export function CommunityShell(_props: { data: HomeShellData; isDesktop: boolean }) {
  const [activeTab, setActiveTab] = useState('Feed');

  return (
    <>
      <View style={s.communityHeader}>
        <Text style={s.chatTitle}>Community</Text>
        <View style={s.communityHeaderActions}>
          <Pressable onPress={() => router.push('/search')} style={s.headerIconBtn}>
            <AppIcon color={colors.appPrimary} name="search" size={16} />
          </Pressable>
          <Pressable onPress={() => router.push('/community/create-post')} style={s.composeBtn}>
            <AppIcon color="#fff" name="plus" size={16} />
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillRow}>
        {communityTabs.map((tab) => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[s.commTab, activeTab === tab && s.commTabActive]}>
            <Text style={[s.commTabText, activeTab === tab && s.commTabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View>
        <Text style={s.storiesLabel}>Active now</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.storiesRow}>
            {storyAvatars.map((a) => (
              <Pressable key={a.initials} style={s.storyWrap}>
                <View style={s.storyRing}>
                  <View style={[s.storyAvatar, { backgroundColor: a.bg }]}>
                    <Text style={s.storyInitials}>{a.initials}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillRow}>
        {trendingTopics.map((tag) => (
          <View key={tag} style={s.trendChip}><Text style={s.trendChipText}>{tag}</Text></View>
        ))}
      </ScrollView>

      {communityFeedPosts.map((post) => <PostCard key={post.id} post={post} />)}

      <Pressable accessibilityRole="button" accessibilityLabel="Create post" onPress={() => router.push('/community/create-post')} style={s.fab}>
        <AppIcon color="#fff" name="plus" size={22} />
      </Pressable>
    </>
  );
}

// ─── PROFILE SHELL ────────────────────────────────────────────────────────────
const profileBadges = [
  { label: 'ID Verified', icon: 'shield' as AppIconName, color: '#00696b', bg: 'rgba(0,105,107,0.08)' },
  { label: 'Trusted Roommate', icon: 'home' as AppIconName, color: '#431ebe', bg: 'rgba(67,30,190,0.07)' },
  { label: 'Carpool Member', icon: 'car' as AppIconName, color: '#ff7e33', bg: 'rgba(255,126,51,0.10)' },
];

const profileLinks = [
  { label: 'My Listings', icon: 'home' as AppIconName, route: '/rooms' },
  { label: 'Saved Items', icon: 'heart' as AppIconName, route: '/saved' },
  { label: 'My Referrals', icon: 'community' as AppIconName, route: '/jobs' },
  { label: 'My Events', icon: 'calendar' as AppIconName, route: '/search' },
  { label: 'Immigration Resources', icon: 'book' as AppIconName, route: '/search' },
];

const profileSettings = [
  { label: 'Edit Profile', icon: 'user' as AppIconName, route: '/settings' },
  { label: 'Notification Settings', icon: 'bell' as AppIconName, route: '/settings' },
  { label: 'Privacy Settings', icon: 'shield' as AppIconName, route: '/settings' },
  { label: 'Help & Support', icon: 'help' as AppIconName, route: '/settings' },
];

export function ProfileShell({ data, displayName }: { data: HomeShellData; displayName: string; isDesktop: boolean }) {
  const user = useAuthStore((s) => s.user);
  const name = user?.user_metadata?.full_name ?? displayName;
  const email = user?.email ?? 'member@manabandhu.com';
  const initial = (name?.[0] ?? 'U').toUpperCase();

  return (
    <>
      <View style={s.profileHero}>
        <View style={s.profileAvatar}><Text style={s.profileAvatarText}>{initial}</Text></View>
        <Text style={s.profileName}>{name}</Text>
        <Text style={s.profileEmail}>{email}</Text>
        <View style={s.profileLocationRow}>
          <AppIcon color="rgba(255,255,255,0.8)" name="map" size={12} />
          <Text style={s.profileLocationText}>Austin, TX · Member since Sep 2024</Text>
        </View>
        <View style={s.profileStats}>
          {[{ v: '47', l: 'Connections' }, { v: '12', l: 'Posts' }, { v: '4', l: 'Referrals' }].map((stat) => (
            <View key={stat.l} style={s.profileStatItem}>
              <Text style={s.profileStatValue}>{stat.v}</Text>
              <Text style={s.profileStatLabel}>{stat.l}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.completionCard}>
        <View style={s.completionHeader}>
          <AppIcon color={colors.appPrimary} name="sparks" size={16} />
          <Text style={s.completionTitle}>Profile {data.metrics[0]?.value ?? '78%'} Complete</Text>
        </View>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: '78%' }]} />
        </View>
        <View style={s.completionChips}>
          {['Add resume', 'Link LinkedIn'].map((chip) => (
            <View key={chip} style={s.completionChip}><Text style={s.completionChipText}>{chip}</Text></View>
          ))}
        </View>
      </View>

      <View style={s.badgesSection}>
        <Text style={s.badgesSectionTitle}>Trust Badges</Text>
        <View style={s.badgesRow}>
          {profileBadges.map((badge) => (
            <View key={badge.label} style={[s.badge, { backgroundColor: badge.bg }]}>
              <AppIcon color={badge.color} name={badge.icon} size={16} />
              <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.settingsSection}>
        <Text style={s.settingsSectionTitle}>QUICK LINKS</Text>
        {profileLinks.map((link) => (
          <Link key={link.label} href={link.route as Href} asChild>
            <Pressable style={s.settingsRow} accessibilityRole="link">
              <View style={s.settingsRowLeft}>
                <View style={s.settingsIconBg}><AppIcon color={colors.appPrimary} name={link.icon} size={16} /></View>
                <Text style={s.settingsLabel}>{link.label}</Text>
              </View>
              <AppIcon color={colors.muted} name="chevron-right" size={16} />
            </Pressable>
          </Link>
        ))}
      </View>

      <View style={s.settingsSection}>
        <Text style={s.settingsSectionTitle}>ACCOUNT</Text>
        {profileSettings.map((setting) => (
          <Link key={setting.label} href={setting.route as Href} asChild>
            <Pressable style={s.settingsRow} accessibilityRole="link">
              <View style={s.settingsRowLeft}>
                <View style={s.settingsIconBg}><AppIcon color={colors.muted} name={setting.icon} size={16} /></View>
                <Text style={s.settingsLabel}>{setting.label}</Text>
              </View>
              <AppIcon color={colors.muted} name="chevron-right" size={16} />
            </Pressable>
          </Link>
        ))}
        <Pressable accessibilityRole="button" onPress={() => useAuthStore.getState().signOut()} style={[s.settingsRow, s.signOutRow]}>
          <View style={s.settingsRowLeft}>
            <View style={[s.settingsIconBg, { backgroundColor: 'rgba(186,26,26,0.08)' }]}><AppIcon color="#ba1a1a" name="logout" size={16} /></View>
            <Text style={s.signOutLabel}>Sign Out</Text>
          </View>
        </Pressable>
      </View>
    </>
  );
}

// ─── SHARED SUB-COMPONENTS ────────────────────────────────────────────────────
function PostCard({ post }: { post: { initials: string; name: string; time: string; group: string; body: string; likes: number; comments: number } }) {
  return (
    <View style={s.postCard}>
      <View style={s.postHeader}>
        <View style={s.postAvatar}><Text style={s.postAvatarText}>{post.initials}</Text></View>
        <View style={s.postMeta}>
          <Text style={s.postName}>{post.name}</Text>
          <Text style={s.postTime}>{post.time} · {post.group}</Text>
        </View>
      </View>
      <Text style={s.postBody}>{post.body}</Text>
      <View style={s.postActions}>
        <Pressable style={s.postAction}><AppIcon color={colors.muted} name="star" size={15} /><Text style={s.postActionText}>{post.likes}</Text></Pressable>
        <Pressable style={s.postAction}><AppIcon color={colors.muted} name="message" size={15} /><Text style={s.postActionText}>{post.comments}</Text></Pressable>
        <Pressable style={s.postAction}><AppIcon color={colors.muted} name="globe" size={15} /><Text style={s.postActionText}>Share</Text></Pressable>
      </View>
    </View>
  );
}

function JobRow({ job }: { job: { company: string; title: string; location: string; bonus: string } }) {
  return (
    <View style={s.jobRow}>
      <View style={s.jobLogo}><Text style={s.jobLogoText}>{job.company}</Text></View>
      <View style={s.jobInfo}>
        <Text style={s.jobTitle}>{job.title}</Text>
        <Text style={s.jobLocation}>{job.location}</Text>
      </View>
      <View style={s.jobBonus}>
        <Text style={s.jobBonusText}>{job.bonus}</Text>
        <Text style={s.jobBonusSub}>Referral</Text>
      </View>
    </View>
  );
}

// Legacy re-exports for backwards compatibility
export { PostCard as CommunityPostCard };
export function SectionTitle({ title }: { title: string }) { return <Text style={s.sectionTitle}>{title}</Text>; }
export type ServiceItem = { icon: AppIconName; label: string; route: string };
export function FeedItem({ icon, title, body, meta }: { icon?: AppIconName; title: string; body: string; meta?: string }) {
  return (
    <View style={s.feedItem}>
      {icon ? <View style={s.feedIcon}><AppIcon color={colors.appPrimary} name={icon} size={20} /></View> : null}
      <View style={s.feedCopy}>
        <View style={s.feedTop}><Text style={s.feedTitle}>{title}</Text>{meta ? <Text style={s.feedMeta}>{meta}</Text> : null}</View>
        <Text style={s.feedBody}>{body}</Text>
      </View>
    </View>
  );
}
export function Stat({ value, label }: { value: string; label: string }) {
  return <View style={s.stat}><Text style={s.statValue}>{value}</Text><Text style={s.statLabel2}>{label}</Text></View>;
}
export function ServiceGroup({ title, items }: { title: string; items: ServiceItem[] }) {
  return (
    <View style={s.serviceGroup}>
      <View style={s.serviceGroupHeader}><Text style={s.serviceGroupTitle}>{title}</Text></View>
      <View style={s.serviceGrid}>
        {items.map((item) => (
          <Link key={`${title}-${item.label}`} href={item.route as Href} asChild>
            <Pressable style={s.superTile} accessibilityRole="button">
              <View style={s.superIcon}><AppIcon color={colors.appPrimary} name={item.icon} size={22} /></View>
              <Text style={s.superLabel}>{item.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}
export function SuperTile({ icon, label, route }: ServiceItem & { featured?: boolean }) {
  return (
    <Link href={route as Href} asChild>
      <Pressable style={s.superTile} accessibilityRole="button" accessibilityLabel={`${label} service`}>
        <View style={s.superIcon}><AppIcon color={colors.appPrimary} name={icon} size={22} /></View>
        <Text style={s.superLabel}>{label}</Text>
      </Pressable>
    </Link>
  );
}
export function MiniAction({ icon, label, route }: { icon: AppIconName; label: string; route: string }) {
  return (
    <Link href={route as Href} asChild>
      <Pressable style={s.miniAction}><AppIcon color={colors.appPrimary} name={icon} size={20} /><Text style={s.miniLabel}>{label}</Text></Pressable>
    </Link>
  );
}
export function ImageCard({ title, meta }: { image: string; title: string; meta: string }) {
  return <View style={s.imageCard}><View style={s.imageCardThumb} /><Text style={s.cardTitle}>{title}</Text><Text style={s.cardMeta}>{meta}</Text></View>;
}
export function InfoCard({ title, body, meta }: { title: string; body: string; meta: string; accent?: boolean }) {
  return <View style={s.infoCard}><Text style={s.cardMeta}>{meta}</Text><Text style={s.cardTitle}>{title}</Text><Text style={s.feedBody}>{body}</Text></View>;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', backgroundColor: 'rgba(250,248,255,0.96)', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', height: 60, justifyContent: 'space-between', paddingHorizontal: space.x4 },
  headerDesktop: { height: 68, paddingHorizontal: space.x6 },
  headerLeft: { alignItems: 'center', flexDirection: 'row', gap: space.x2 },
  logoMark: { alignItems: 'center', backgroundColor: colors.appPrimary, borderRadius: 10, height: 34, justifyContent: 'center', width: 34 },
  logoText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  brandName: { color: colors.appPrimary, fontSize: 18, fontWeight: '800' },
  desktopNav: { flexDirection: 'row', gap: space.x2 },
  desktopNavLink: { paddingHorizontal: space.x3, paddingVertical: space.x2 },
  desktopNavText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  desktopNavActive: { color: colors.appPrimary },
  headerRight: { alignItems: 'center', flexDirection: 'row', gap: space.x3 },
  headerIconBtn: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, height: 34, justifyContent: 'center', width: 34 },
  notifDot: { backgroundColor: '#ba1a1a', borderColor: colors.surface, borderRadius: 5, borderWidth: 1.5, bottom: 5, height: 9, position: 'absolute', right: 5, width: 9 },
  content: { gap: space.x4, padding: space.x4, paddingBottom: 100 },
  contentDesktop: { paddingHorizontal: space.x8, paddingTop: space.x6 },
  searchBar: { alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderColor: 'rgba(67,30,190,0.15)', borderRadius: radius.pill, borderWidth: 1.5, flexDirection: 'row', gap: space.x3, minHeight: 50, paddingHorizontal: space.x4 },
  searchPlaceholder: { color: colors.muted, flex: 1, fontSize: 14, fontWeight: '600' },
  filterPill: { alignItems: 'center', backgroundColor: colors.indigoSoft, borderRadius: 10, height: 30, justifyContent: 'center', width: 30 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: space.x2 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  seeAll: { color: colors.appPrimary, fontSize: 13, fontWeight: '800' },
  greetRow: { gap: 4 },
  greetText: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  locationChip: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  locationText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3 },
  qaGridDesktop: { gap: space.x4 },
  qaTile: { alignItems: 'center', borderRadius: 16, gap: 6, justifyContent: 'center', minHeight: 80, padding: space.x2, width: '22%' },
  qaLabel: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  pillRow: { marginVertical: space.x1 },
  statPill: { alignItems: 'center', borderRadius: radius.pill, flexDirection: 'row', gap: 6, marginRight: space.x2, paddingHorizontal: space.x3, paddingVertical: 8 },
  statDot: { borderRadius: 4, height: 7, width: 7 },
  statPillText: { fontSize: 12, fontWeight: '700' },
  hScroll: { marginVertical: space.x1 },
  roomCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginRight: space.x3, overflow: 'hidden', width: 180 },
  roomThumb: { alignItems: 'center', backgroundColor: colors.indigoSoft, height: 100, justifyContent: 'center' },
  roomThumbEmoji: { fontSize: 36 },
  roomInfo: { gap: 4, padding: space.x3 },
  roomPrice: { color: colors.appPrimary, fontSize: 16, fontWeight: '900' },
  roomTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  roomMeta: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  roomLocation: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  verifiedBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.tealSoft, borderRadius: 999, flexDirection: 'row', gap: 3, marginTop: 2, paddingHorizontal: 7, paddingVertical: 3 },
  verifiedText: { color: colors.teal, fontSize: 10, fontWeight: '800' },
  postCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: space.x3, padding: space.x4 },
  postHeader: { alignItems: 'center', flexDirection: 'row', gap: space.x3 },
  postAvatar: { alignItems: 'center', backgroundColor: colors.appPrimary, borderRadius: 22, height: 42, justifyContent: 'center', width: 42 },
  postAvatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  postMeta: { gap: 2 },
  postName: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  postTime: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  postBody: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  postActions: { flexDirection: 'row', gap: space.x4, paddingTop: space.x1 },
  postAction: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  postActionText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  jobRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: space.x3, padding: space.x4 },
  jobLogo: { alignItems: 'center', backgroundColor: colors.indigoSoft, borderRadius: 14, height: 46, justifyContent: 'center', width: 46 },
  jobLogoText: { color: colors.appPrimary, fontSize: 18, fontWeight: '900' },
  jobInfo: { flex: 1, gap: 2 },
  jobTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  jobLocation: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  jobBonus: { alignItems: 'flex-end', gap: 2 },
  jobBonusText: { color: colors.warm, fontSize: 14, fontWeight: '900' },
  jobBonusSub: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  exploreHero: { gap: 4 },
  exploreHeroTitle: { color: colors.ink, fontSize: 28, fontWeight: '900' },
  exploreHeroSub: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  catChip: { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.pill, marginRight: space.x2, paddingHorizontal: space.x4, paddingVertical: 8 },
  catChipActive: { backgroundColor: colors.appPrimary },
  catChipText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  catChipTextActive: { color: '#fff' },
  featuredCard: { alignItems: 'center', backgroundColor: colors.primaryContainer, borderRadius: 22, flexDirection: 'row', justifyContent: 'space-between', minHeight: 120, overflow: 'hidden', padding: space.x4 },
  featuredOverlay: { flex: 1, gap: 6 },
  featuredBadge: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800' },
  featuredTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  featuredSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  featuredEmoji: { fontSize: 44 },
  exploreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3 },
  exploreGridDesktop: { gap: space.x4 },
  exploreCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, overflow: 'hidden', width: '47%' },
  exploreCardThumb: { alignItems: 'center', height: 90, justifyContent: 'center' },
  exploreCardEmoji: { fontSize: 32 },
  exploreCardBody: { gap: 4, padding: space.x3 },
  exploreCardTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  exploreCardSub: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  exploreBadge: { alignSelf: 'flex-start', borderRadius: radius.pill, marginTop: 4, paddingHorizontal: 8, paddingVertical: 3 },
  exploreBadgeText: { fontSize: 10, fontWeight: '800' },
  chatHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  chatTitle: { color: colors.ink, fontSize: 26, fontWeight: '900' },
  composeBtn: { alignItems: 'center', backgroundColor: colors.appPrimary, borderRadius: 14, height: 38, justifyContent: 'center', width: 38 },
  pinnedRow: { alignItems: 'center', backgroundColor: colors.tealSoft, borderColor: 'rgba(0,105,107,0.2)', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: space.x3, padding: space.x3 },
  pinnedIcon: { alignItems: 'center', backgroundColor: 'rgba(0,105,107,0.15)', borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  pinnedBody: { flex: 1, gap: 2 },
  pinnedTitle: { color: colors.teal, fontSize: 13, fontWeight: '800' },
  pinnedSub: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  convList: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  convListHeader: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, paddingHorizontal: space.x4, paddingVertical: space.x3 },
  convRow: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: space.x3, paddingHorizontal: space.x4, paddingVertical: space.x3 },
  convAvatarWrap: { position: 'relative' },
  convAvatar: { alignItems: 'center', backgroundColor: colors.appPrimary, borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  convAvatarGroup: { backgroundColor: colors.teal },
  convAvatarText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  onlineDot: { backgroundColor: '#22c55e', borderColor: colors.surface, borderRadius: 7, borderWidth: 2, bottom: 0, height: 13, position: 'absolute', right: 0, width: 13 },
  convBody: { flex: 1, gap: 3 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between' },
  convName: { color: colors.ink, flex: 1, fontSize: 14, fontWeight: '800' },
  convTime: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  convPreview: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  convPreviewUnread: { color: colors.ink, fontWeight: '700' },
  unreadBadge: { alignItems: 'center', backgroundColor: colors.appPrimary, borderRadius: 12, height: 22, justifyContent: 'center', minWidth: 22, paddingHorizontal: 5 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  newChatBtn: { alignItems: 'center', borderColor: colors.appPrimary, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', gap: space.x2, justifyContent: 'center', paddingVertical: space.x3 },
  newChatText: { color: colors.appPrimary, fontSize: 14, fontWeight: '800' },
  communityHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  communityHeaderActions: { alignItems: 'center', flexDirection: 'row', gap: space.x2 },
  commTab: { borderRadius: radius.pill, marginRight: space.x2, paddingHorizontal: space.x4, paddingVertical: 8 },
  commTabActive: { backgroundColor: colors.appPrimary },
  commTabText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  commTabTextActive: { color: '#fff' },
  storiesLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  storiesRow: { flexDirection: 'row', gap: space.x3 },
  storyWrap: { alignItems: 'center', gap: 4 },
  storyRing: { borderColor: colors.appPrimary, borderRadius: 32, borderWidth: 2.5, padding: 2 },
  storyAvatar: { alignItems: 'center', borderRadius: 28, height: 54, justifyContent: 'center', width: 54 },
  storyInitials: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  trendChip: { backgroundColor: colors.tealSoft, borderRadius: radius.pill, marginRight: space.x2, paddingHorizontal: space.x3, paddingVertical: 8 },
  trendChipText: { color: colors.teal, fontSize: 12, fontWeight: '800' },
  fab: { alignItems: 'center', alignSelf: 'flex-end', backgroundColor: colors.appPrimary, borderRadius: 20, elevation: 6, height: 56, justifyContent: 'center', shadowColor: colors.appPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, width: 56 },
  profileHero: { alignItems: 'center', backgroundColor: colors.appPrimary, borderRadius: 24, gap: space.x2, overflow: 'hidden', paddingBottom: space.x5, paddingTop: space.x5 },
  profileAvatar: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.5)', borderRadius: 52, borderWidth: 3, height: 96, justifyContent: 'center', width: 96 },
  profileAvatarText: { color: '#fff', fontSize: 36, fontWeight: '900' },
  profileName: { color: '#fff', fontSize: 22, fontWeight: '900' },
  profileEmail: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  profileLocationRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  profileLocationText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  profileStats: { flexDirection: 'row', gap: space.x6, marginTop: space.x2 },
  profileStatItem: { alignItems: 'center', gap: 3 },
  profileStatValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
  profileStatLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700' },
  completionCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: space.x3, padding: space.x4 },
  completionHeader: { alignItems: 'center', flexDirection: 'row', gap: space.x2 },
  completionTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  progressBg: { backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 6, height: 8, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.appPrimary, borderRadius: 6, height: 8 },
  completionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
  completionChip: { backgroundColor: colors.indigoSoft, borderRadius: radius.pill, paddingHorizontal: space.x3, paddingVertical: 6 },
  completionChipText: { color: colors.appPrimary, fontSize: 12, fontWeight: '800' },
  badgesSection: { gap: space.x3 },
  badgesSectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
  badge: { alignItems: 'center', borderRadius: radius.pill, flexDirection: 'row', gap: 6, paddingHorizontal: space.x3, paddingVertical: 8 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  settingsSection: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  settingsSectionTitle: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, paddingHorizontal: space.x4, paddingVertical: space.x3 },
  settingsRow: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.x4, paddingVertical: space.x3 },
  settingsRowLeft: { alignItems: 'center', flexDirection: 'row', gap: space.x3 },
  settingsIconBg: { alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: 10, height: 34, justifyContent: 'center', width: 34 },
  settingsLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  signOutRow: {},
  signOutLabel: { color: '#ba1a1a', fontSize: 14, fontWeight: '700' },
  tabBar: { backgroundColor: 'rgba(250,248,255,0.97)', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', height: 70, paddingHorizontal: space.x2 },
  tab: { alignItems: 'center', flex: 1, gap: 3, justifyContent: 'center', paddingTop: 6 },
  tabPill: { backgroundColor: colors.appPrimary, borderRadius: 3, height: 3, marginBottom: 2, width: 20 },
  tabLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  tabLabelActive: { color: colors.appPrimary },
  // Legacy shared
  feedItem: { backgroundColor: colors.surface, borderRadius: 16, flexDirection: 'row', gap: space.x3, padding: space.x3 },
  feedIcon: { alignItems: 'center', backgroundColor: colors.indigoSoft, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  feedCopy: { flex: 1, gap: space.x1 },
  feedTop: { flexDirection: 'row', gap: space.x2, justifyContent: 'space-between' },
  feedTitle: { color: colors.ink, flex: 1, fontSize: 14, fontWeight: '800' },
  feedMeta: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  feedBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  stat: { alignItems: 'center', gap: space.x1 },
  statValue: { color: colors.appPrimary, fontSize: 20, fontWeight: '800' },
  statLabel2: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  serviceGroup: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: 1, gap: space.x3, padding: space.x4 },
  serviceGroupHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  serviceGroupTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.x4 },
  superTile: { alignItems: 'center', flexBasis: '25%', gap: space.x2, minHeight: 88, minWidth: 74, paddingHorizontal: space.x1 },
  superIcon: { alignItems: 'center', backgroundColor: colors.indigoSoft, borderRadius: 18, height: 52, justifyContent: 'center', width: 52 },
  superLabel: { color: colors.ink, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  imageCard: { backgroundColor: colors.surface, borderRadius: 24, flex: 1, minWidth: 180, overflow: 'hidden' },
  imageCardThumb: { backgroundColor: colors.indigoSoft, height: 140, width: '100%' },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', lineHeight: 23, paddingHorizontal: space.x4, paddingTop: space.x3 },
  cardMeta: { color: colors.appPrimary, fontSize: 12, fontWeight: '800', paddingHorizontal: space.x4, paddingVertical: space.x2 },
  infoCard: { backgroundColor: colors.surface, borderRadius: 20, gap: space.x2, padding: space.x4 },
  miniAction: { backgroundColor: colors.surfaceContainerHigh, borderRadius: 20, flex: 1, gap: space.x2, minHeight: 112, minWidth: 150, padding: space.x3 },
  miniLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' },
});

