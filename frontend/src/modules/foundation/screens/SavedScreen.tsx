import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Event } from '@/modules/events/api';
import { listEvents } from '@/modules/events/api';
import { listMarketplaceListings } from '@/modules/marketplace/api';
import type { MarketplaceListing } from '@/modules/marketplace/types';
import { listRoomListings } from '@/modules/rooms/api';
import type { RoomListing } from '@/modules/rooms/types';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const C = {
  primary: '#E05638', // Warm Saffron
  secondary: '#0D5C75', // Deep Gulf Teal
  bg: '#FFFDF9', // Soft warm ivory
  cardBg: '#FFFFFF',
  border: '#E8DEC8',
  ink: '#151D21',
  inkMuted: '#6B7280',
  tealBg: '#E0F2FE',
  saffronBg: '#FEE2E2',
};

const TABS = [
  { id: 'all', label: 'All Saved' },
  { id: 'rooms', label: 'Rooms 🏠' },
  { id: 'market', label: 'Market 🛍️' },
  { id: 'events', label: 'Events 🎉' },
];

export function SavedScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activeTab, setActiveTab] = useState('all');

  const { data: rooms = [] } = useQuery<RoomListing[]>({
    queryKey: ['rooms', 'saved-preview'],
    queryFn: () => listRoomListings().catch(() => []),
  });
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['events', 'saved-preview'],
    queryFn: () => listEvents().catch(() => []),
  });
  const { data: market = [] } = useQuery<MarketplaceListing[]>({
    queryKey: ['market', 'saved-preview'],
    queryFn: () => listMarketplaceListings().catch(() => []),
  });

  // For demonstration, showcase first available active items as saved
  const savedRooms: RoomListing[] = rooms.slice(0, 2);
  const savedMarket: MarketplaceListing[] = market.slice(0, 2);
  const savedEvents: Event[] = events.slice(0, 1);

  const totalSavedCount = savedRooms.length + savedMarket.length + savedEvents.length;

  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.container, isDesktop && s.containerDesktop]}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.titleRow}>
            <Pressable onPress={() => router.back()} style={s.backBtn}>
              <AppIcon name="chevron-left" size={20} color={C.ink} />
            </Pressable>
            <View>
              <Text style={s.headerTitle}>Saved Items</Text>
              <Text style={s.headerSub}>{totalSavedCount} bookmarked listings & events</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.tabBarScroll}
          contentContainerStyle={s.tabBar}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[s.tabChip, active && s.tabChipActive]}
              >
                <Text style={[s.tabChipText, active && s.tabChipTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          style={s.contentScroll}
          contentContainerStyle={s.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Saved Rooms */}
          {(activeTab === 'all' || activeTab === 'rooms') && savedRooms.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Saved Rooms & Housing</Text>
                <Pressable onPress={() => router.push('/rooms')}>
                  <Text style={s.seeMoreText}>Explore More →</Text>
                </Pressable>
              </View>
              {savedRooms.map((r: RoomListing) => (
                <Pressable
                  key={r.id}
                  onPress={() => router.push(`/rooms/${r.id}` as any)}
                  style={s.card}
                >
                  <View style={s.cardLeft}>
                    <View style={s.cardIconBadge}>
                      <Text style={s.cardEmoji}>🏠</Text>
                    </View>
                    <View style={s.cardInfo}>
                      <Text style={s.cardTitle} numberOfLines={1}>
                        {r.title}
                      </Text>
                      <Text style={s.cardSub}>
                        {r.broadLocation ?? 'Austin, TX'} · ${r.price}/mo
                      </Text>
                    </View>
                  </View>
                  <AppIcon name="chevron-right" size={16} color={C.secondary} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Saved Marketplace Items */}
          {(activeTab === 'all' || activeTab === 'market') && savedMarket.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Saved Marketplace Deals</Text>
                <Pressable onPress={() => router.push('/marketplace')}>
                  <Text style={s.seeMoreText}>Explore More →</Text>
                </Pressable>
              </View>
              {savedMarket.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => router.push(`/marketplace/${m.id}` as any)}
                  style={s.card}
                >
                  <View style={s.cardLeft}>
                    <View style={[s.cardIconBadge, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={s.cardEmoji}>🛍️</Text>
                    </View>
                    <View style={s.cardInfo}>
                      <Text style={s.cardTitle} numberOfLines={1}>
                        {m.title}
                      </Text>
                      <Text style={s.cardSub}>
                        {m.location ?? 'Austin'} · ${m.price} {m.negotiable ? '(Negotiable)' : ''}
                      </Text>
                    </View>
                  </View>
                  <AppIcon name="chevron-right" size={16} color={C.secondary} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Saved Events */}
          {(activeTab === 'all' || activeTab === 'events') && savedEvents.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Saved Events & Festivals</Text>
                <Pressable onPress={() => router.push('/events')}>
                  <Text style={s.seeMoreText}>Explore More →</Text>
                </Pressable>
              </View>
              {savedEvents.map((e) => (
                <Pressable
                  key={e.id}
                  onPress={() => router.push(`/events/${e.id}` as any)}
                  style={s.card}
                >
                  <View style={s.cardLeft}>
                    <View style={[s.cardIconBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={s.cardEmoji}>🎉</Text>
                    </View>
                    <View style={s.cardInfo}>
                      <Text style={s.cardTitle} numberOfLines={1}>
                        {e.title}
                      </Text>
                      <Text style={s.cardSub}>
                        {e.location} · {e.date ? new Date(e.date).toLocaleDateString() : 'Upcoming'}
                      </Text>
                    </View>
                  </View>
                  <AppIcon name="chevron-right" size={16} color={C.secondary} />
                </Pressable>
              ))}
            </View>
          )}

          {totalSavedCount === 0 && (
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>🔖</Text>
              <Text style={s.emptyTitle}>No saved items yet</Text>
              <Text style={s.emptySub}>
                Tap the heart or bookmark icon on any room, marketplace listing, or festival to save
                it here.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  container: {
    flex: 1,
    width: '100%',
  },
  containerDesktop: {
    maxWidth: 960,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.ink,
  },
  headerSub: {
    fontSize: 13,
    color: C.inkMuted,
  },
  tabBarScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  tabBar: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  tabChip: {
    backgroundColor: C.cardBg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tabChipActive: {
    backgroundColor: C.secondary,
    borderColor: C.secondary,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.ink,
  },
  tabChipTextActive: {
    color: '#FFF',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
  },
  seeMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    shadowColor: '#2B3338',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  cardIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 18,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
  },
  cardSub: {
    fontSize: 12,
    color: C.inkMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
  },
  emptySub: {
    fontSize: 13,
    color: C.inkMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
});
