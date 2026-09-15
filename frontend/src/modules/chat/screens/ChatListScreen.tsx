import { radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Conversation, listConversations } from '@/modules/chat/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SearchBar } from '@/modules/shared/components/SearchBar';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { useAdaptiveLayout } from '@/platform/adaptive';

type CategoryFilter = 'All' | 'Marketplace' | 'Rooms' | 'Rides';

interface EnrichedConversation extends Conversation {
  moduleCategory?: 'Marketplace' | 'Rooms' | 'Rides' | 'General';
  inquiryContext?: string;
  isOnline?: boolean;
  avatarInitial?: string;
  isVerified?: boolean;
}

const SAMPLE_INQUIRIES: EnrichedConversation[] = [
  {
    id: 'conv-mkt-1',
    type: 'DIRECT',
    title: 'Suresh Reddy',
    lastMessage: 'Sure! I can meet tomorrow at 11 AM in front of Patel Brothers.',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    unreadCount: 2,
    moduleCategory: 'Marketplace',
    inquiryContext: 'Preethi Eco Twin Mixer • $45 Offer',
    isOnline: true,
    avatarInitial: 'SR',
    isVerified: true,
  },
  {
    id: 'conv-room-1',
    type: 'DIRECT',
    title: 'Ananya Rao',
    lastMessage: 'Yes, the private room with attached bath is available from Oct 1st.',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    unreadCount: 0,
    moduleCategory: 'Rooms',
    inquiryContext: 'North Austin 1BHK • $750/mo',
    isOnline: true,
    avatarInitial: 'AR',
    isVerified: true,
  },
  {
    id: 'conv-ride-1',
    type: 'DIRECT',
    title: 'Karthik Varma',
    lastMessage: 'Got your seat request! Leaving at 7:30 AM from Round Rock HEB.',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    unreadCount: 1,
    moduleCategory: 'Rides',
    inquiryContext: 'Austin → Dallas Carpool • 2 Seats',
    isOnline: false,
    avatarInitial: 'KV',
    isVerified: true,
  },
  {
    id: 'conv-mkt-2',
    type: 'DIRECT',
    title: 'Deepa Goud',
    lastMessage: 'Is the Ultra Pride wet grinder still under warranty?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    unreadCount: 0,
    moduleCategory: 'Marketplace',
    inquiryContext: 'Ultra Pride+ Wet Grinder • $95',
    isOnline: false,
    avatarInitial: 'DG',
    isVerified: true,
  },
];

export default function ChatListScreen() {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryFilter>('All');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: listConversations,
  });

  // Combine live data with sample inquiries for zero-state demonstration
  const allConversations: EnrichedConversation[] = useMemo(() => {
    const liveList: EnrichedConversation[] = (data ?? []).map((c, idx) => {
      let moduleCategory: 'Marketplace' | 'Rooms' | 'Rides' | 'General' = 'General';
      let inquiryContext: string | undefined;

      const titleLower = (c.title ?? '').toLowerCase();
      if (
        c.type === 'ROOM_INQUIRY' ||
        titleLower.includes('room inquiry') ||
        titleLower.includes('room')
      ) {
        moduleCategory = 'Rooms';
        inquiryContext = c.title?.replace(/^(Room Inquiry:\s*|Room:\s*)/i, '') || 'Room Inquiry';
      } else if (
        c.type === 'RIDE_TEMP' ||
        titleLower.includes('ride') ||
        titleLower.includes('carpool')
      ) {
        moduleCategory = 'Rides';
        inquiryContext = c.title?.replace(/^(Ride:\s*|Carpool:\s*)/i, '') || 'Ride Coordination';
      } else if (
        titleLower.includes('offer') ||
        titleLower.includes('item') ||
        titleLower.includes('mixer')
      ) {
        moduleCategory = 'Marketplace';
        inquiryContext = c.title;
      }

      return {
        ...c,
        moduleCategory,
        inquiryContext,
        avatarInitial: (c.title ?? 'MB').slice(0, 2).toUpperCase(),
        isOnline: idx % 2 === 0,
        isVerified: true,
      };
    });

    if (liveList.length > 0) {
      // Prioritize live conversations; append samples that don't collide
      const liveIds = new Set(liveList.map((l) => l.id));
      const remainingSamples = SAMPLE_INQUIRIES.filter((s) => !liveIds.has(s.id));
      return [...liveList, ...remainingSamples];
    }
    return SAMPLE_INQUIRIES;
  }, [data]);

  const filtered = useMemo(() => {
    return allConversations.filter((c) => {
      const matchesSearch =
        !query.trim() ||
        (c.title ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (c.lastMessage ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (c.inquiryContext ?? '').toLowerCase().includes(query.toLowerCase());

      const matchesTab = activeTab === 'All' || c.moduleCategory === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [allConversations, query, activeTab]);

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getModuleBadge = (cat?: string) => {
    switch (cat) {
      case 'Marketplace':
        return { label: '🛍️ Marketplace', bg: 'rgba(255,126,51,0.12)', text: '#ff7e33' };
      case 'Rooms':
        return { label: '🏠 Room Inquiry', bg: 'rgba(67,30,190,0.10)', text: '#431ebe' };
      case 'Rides':
        return { label: '🚗 Ride Coordination', bg: 'rgba(0,105,107,0.10)', text: '#00696b' };
      default:
        return { label: '💬 General', bg: '#f1f3f9', text: '#625f6e' };
    }
  };

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load messages"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Messages & Inquiries</Text>
              <Text style={styles.headerSubtitle}>
                Item negotiations, room visits, and carpool pickups
              </Text>
            </View>
            <Pressable
              style={styles.newChatBtn}
              onPress={() => router.push('/chat/new')}
              accessibilityRole="button"
              accessibilityLabel="Start new chat"
            >
              <AppIcon name="plus" size={18} color="#fff" />
              <Text style={styles.newChatText}>New</Text>
            </Pressable>
          </View>

          {/* Search bar */}
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search conversations, items, or routes..."
          />

          {/* Module Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            {(['All', 'Marketplace', 'Rooms', 'Rides'] as CategoryFilter[]).map((tab) => {
              const isActive = activeTab === tab;
              const count = allConversations.filter(
                (c) => tab === 'All' || c.moduleCategory === tab,
              ).length;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabChip, isActive && styles.tabChipActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                    {tab} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Conversation List */}
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No messages found"
              body={
                query
                  ? 'No conversations match your search.'
                  : 'Start a new conversation to connect with fellow Bandhus.'
              }
              actionLabel="Start New Chat"
              onAction={() => router.push('/chat/new')}
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((c) => {
                const badge = getModuleBadge(c.moduleCategory);
                const hasUnread = (c.unreadCount ?? 0) > 0;
                return (
                  <Pressable
                    key={c.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Open chat with ${c.title ?? ''}`}
                    onPress={() => router.push(`/chat/${c.id}`)}
                    style={[styles.itemCard, hasUnread && styles.itemCardUnread]}
                  >
                    {/* Avatar & Online Dot */}
                    <View style={styles.avatarWrap}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{c.avatarInitial ?? 'MB'}</Text>
                      </View>
                      {c.isOnline ? <View style={styles.onlineDot} /> : null}
                    </View>

                    {/* Chat Details */}
                    <View style={styles.itemBody}>
                      {/* Top row: Name, Verified Badge, Time */}
                      <View style={styles.topRow}>
                        <View style={styles.nameRow}>
                          <Text style={styles.itemTitle}>{c.title ?? 'ManaBandhu Member'}</Text>
                          {c.isVerified ? (
                            <View style={styles.verifiedTag}>
                              <AppIcon name="shield" size={11} color="#00696b" />
                              <Text style={styles.verifiedText}>Verified</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={[styles.timeText, hasUnread && styles.timeTextUnread]}>
                          {formatTimestamp(c.lastMessageAt)}
                        </Text>
                      </View>

                      {/* Inquiry Context Pill */}
                      {c.inquiryContext ? (
                        <View style={[styles.contextPill, { backgroundColor: badge.bg }]}>
                          <Text
                            style={[styles.contextText, { color: badge.text }]}
                            numberOfLines={1}
                          >
                            {c.inquiryContext}
                          </Text>
                        </View>
                      ) : null}

                      {/* Last Message and Unread badge */}
                      <View style={styles.bottomRow}>
                        <Text
                          style={[styles.itemSubtitle, hasUnread && styles.itemSubtitleUnread]}
                          numberOfLines={1}
                        >
                          {c.lastMessage ?? 'No messages yet'}
                        </Text>
                        {hasUnread ? (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{c.unreadCount}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Quick Actions Footer */}
          <View style={styles.actions}>
            <AppButton label="Start New Chat" route="/chat/new" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#faf8ff' },
  page: { flexGrow: 1, padding: space.x4 },
  container: { gap: space.x3, width: '100%', alignSelf: 'center' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: { flex: 1 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#131b2e',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#625f6e',
    marginTop: 2,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#431ebe',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  newChatText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  tabsScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: '#f1f3f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabChipActive: {
    backgroundColor: '#431ebe',
    borderColor: '#431ebe',
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#625f6e',
  },
  tabChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  list: { gap: 10 },
  itemCard: {
    backgroundColor: '#ffffff',
    borderColor: '#eaedff',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  itemCardUnread: {
    borderColor: '#c6cbff',
    backgroundColor: '#ffffff',
  },

  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e6e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#431ebe',
  },
  avatarText: {
    color: '#431ebe',
    fontSize: 15,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#16a34a',
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  itemBody: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    color: '#131b2e',
    fontSize: 15,
    fontWeight: '800',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,105,107,0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00696b',
  },
  timeText: {
    fontSize: 11,
    color: '#8b8e9b',
    fontWeight: '500',
  },
  timeTextUnread: {
    color: '#431ebe',
    fontWeight: '700',
  },

  contextPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 1,
  },
  contextText: {
    fontSize: 11,
    fontWeight: '700',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemSubtitle: {
    color: '#625f6e',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  itemSubtitleUnread: {
    color: '#131b2e',
    fontWeight: '700',
  },

  unreadBadge: {
    backgroundColor: '#431ebe',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  actions: {
    marginTop: space.x2,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
