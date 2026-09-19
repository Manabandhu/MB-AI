import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getNotificationsInbox } from '@/modules/notifications/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';

const C = {
  primary: '#431ebe',
  secondary: '#00696b',
  bg: '#faf8ff',
  cardBg: '#ffffff',
  border: '#e2e8f0',
  ink: '#131b2e',
  inkMuted: '#625f6e',
  emerald: '#1b873f',
  emeraldBg: '#e6f7ed',
  tealBg: '#e6f4f4',
  saffronBg: '#fff0e8',
};

function getCategoryIcon(title: string): { icon: AppIconName; bg: string; color: string } {
  const t = title.toLowerCase();
  if (t.includes('room') || t.includes('stay') || t.includes('house')) {
    return { icon: 'home', bg: '#EDE9FE', color: '#6D28D9' };
  }
  if (t.includes('ride') || t.includes('carpool') || t.includes('seat')) {
    return { icon: 'car', bg: '#CCFBF1', color: '#0F766E' };
  }
  if (t.includes('job') || t.includes('referral') || t.includes('interview')) {
    return { icon: 'briefcase', bg: '#FEF3C7', color: '#B45309' };
  }
  if (t.includes('event') || t.includes('festival') || t.includes('meetup')) {
    return { icon: 'calendar', bg: '#FEE2E2', color: '#DC2626' };
  }
  if (t.includes('safety') || t.includes('alert') || t.includes('verification')) {
    return { icon: 'shield', bg: '#FEE2E2', color: '#DC2626' };
  }
  return { icon: 'bell', bg: '#E0F2FE', color: '#0369A1' };
}

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Welcome to ManaBandhu! 🎉',
    body: 'Your profile has been created. Explore rooms, rides, and cultural events near you.',
    created_at: new Date().toISOString(),
    read: false,
    route: '/home',
    meta: 'Just now',
  },
  {
    id: 'n2',
    title: 'New Room Listing in North Austin 🏠',
    body: 'A private room with attached bath in Domain/Round Rock was just posted.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    route: '/rooms',
    meta: '1h ago',
  },
  {
    id: 'n3',
    title: 'Austin Diwali Mela RSVP Confirmed 🪔',
    body: 'Your spot is saved for Austin Grand Diwali Mela on Oct 24 at Round Rock.',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    read: true,
    route: '/events',
    meta: '2h ago',
  },
];

export function NotificationsInboxScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const _isCompact = width < 360;
  const isDesktop = width >= 768;

  const [query, setQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', 'inbox'],
    queryFn: getNotificationsInbox,
    retry: false,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const rawItems = data?.items ?? [];
  const items = rawItems.length > 0 ? rawItems : DEFAULT_NOTIFICATIONS;
  const unreadCount = items.filter((item) => !item.read).length;

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filterTab === 'unread' && item.read) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.body.toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, query, filterTab]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={[s.content, isDesktop && s.contentDesktop]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* Header Bar */}
        <View style={s.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={s.iconBtn}
          >
            <AppIcon name="chevron-left" size={20} color={C.ink} />
          </Pressable>

          <View style={s.headerTitleCol}>
            <View style={s.titleBadgeRow}>
              <Text style={s.headerTitle}>Notifications</Text>
              {unreadCount > 0 ? (
                <View style={s.unreadPill}>
                  <Text style={s.unreadPillText}>{unreadCount} new</Text>
                </View>
              ) : null}
            </View>
            <Text style={s.headerSubtitle}>Rooms, rides, jobs, and safety updates</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notification Preferences"
            onPress={() => router.push('/notifications/settings')}
            style={s.iconBtn}
          >
            <AppIcon name="wrench" size={18} color={C.ink} />
          </Pressable>
        </View>

        {/* Filter Tabs */}
        <View style={s.tabsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="All notifications"
            onPress={() => setFilterTab('all')}
            style={[s.tabPill, filterTab === 'all' && s.tabPillActive]}
          >
            <Text style={[s.tabText, filterTab === 'all' && s.tabTextActive]}>
              All ({items.length})
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Unread notifications"
            onPress={() => setFilterTab('unread')}
            style={[s.tabPill, filterTab === 'unread' && s.tabPillActive]}
          >
            <Text style={[s.tabText, filterTab === 'unread' && s.tabTextActive]}>
              Unread ({unreadCount})
            </Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={s.searchContainer}>
          <AppIcon name="search" size={16} color={C.inkMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search notification messages..."
            placeholderTextColor={C.inkMuted}
            style={s.searchInput}
            accessibilityLabel="Search notifications"
          />
          {query.trim() ? (
            <Pressable onPress={() => setQuery('')}>
              <Text style={{ fontSize: 14, color: C.inkMuted, fontWeight: '700' }}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Notification Cards List */}
        {isLoading ? (
          <View style={s.centerBox}>
            <LoadingState label="Loading inbox..." />
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyWrap}>
            <EmptyState
              title={filterTab === 'unread' ? 'No unread notifications' : 'No notifications'}
              body={
                filterTab === 'unread'
                  ? "You've caught up on all new updates."
                  : 'Important updates about your rooms, rides, and inquiries will appear here.'
              }
              actionLabel="Explore Community"
              onAction={() => router.push('/explore')}
            />
          </View>
        ) : (
          <View style={s.notificationsList}>
            {filtered.map((item) => {
              const iconStyle = getCategoryIcon(item.title);
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  onPress={() => router.push(`/notifications/${item.id}` as any)}
                  style={[s.notifCard, !item.read && s.notifCardUnread]}
                >
                  <View style={[s.iconBox, { backgroundColor: iconStyle.bg }]}>
                    <AppIcon name={iconStyle.icon} size={20} color={iconStyle.color} />
                  </View>
                  <View style={s.notifBody}>
                    <View style={s.notifTopRow}>
                      <Text style={s.notifTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={s.notifMeta}>{item.meta}</Text>
                    </View>
                    <Text style={s.notifDesc} numberOfLines={2}>
                      {item.body}
                    </Text>
                  </View>
                  {!item.read ? <View style={s.unreadDot} /> : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  contentDesktop: {
    padding: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleCol: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.ink,
  },
  headerSubtitle: {
    fontSize: 12,
    color: C.inkMuted,
    marginTop: 2,
  },
  unreadPill: {
    backgroundColor: C.saffronBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadPillText: {
    color: C.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabPillActive: {
    backgroundColor: C.secondary,
    borderColor: C.secondary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.inkMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.ink,
  },
  centerBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyWrap: {
    marginTop: 20,
  },
  notificationsList: {
    gap: 10,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: '#FFFAF5',
    borderColor: '#FDBA74',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBody: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
    flex: 1,
    marginRight: 8,
  },
  notifMeta: {
    fontSize: 11,
    color: C.inkMuted,
    fontWeight: '500',
  },
  notifDesc: {
    fontSize: 13,
    color: C.inkMuted,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
});
