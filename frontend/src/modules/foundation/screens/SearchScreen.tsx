import { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { listRoomListings } from '@/modules/rooms/api';
import type { RoomListing } from '@/modules/rooms/types';
import { listEvents } from '@/modules/events/api';
import type { Event } from '@/modules/events/api';
import { listMarketplaceListings } from '@/modules/marketplace/api';
import type { MarketplaceListing } from '@/modules/marketplace/types';
import { listJobPostings } from '@/modules/jobs/api';
import type { JobPosting } from '@/modules/jobs/types';

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
  goldBg: '#FEF3C7',
};

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'rooms', label: 'Rooms 🏠' },
  { id: 'rides', label: 'Rides 🚗' },
  { id: 'jobs', label: 'Jobs 💼' },
  { id: 'events', label: 'Events 🎉' },
  { id: 'market', label: 'Market 🛍️' },
];

const POPULAR_SEARCHES = [
  { label: 'UT Austin shared room', category: 'rooms', route: '/rooms' },
  { label: 'Austin to Dallas carpool', category: 'rides', route: '/rides' },
  { label: 'Diwali & Ugadi Mela', category: 'events', route: '/events' },
  { label: 'Pre-loved mixer grinder', category: 'market', route: '/marketplace' },
  { label: 'Tech employee referrals', category: 'jobs', route: '/jobs' },
];

export function SearchScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 360; // Narrow fold cover screen
  const isDesktop = width >= 768; // Tablet / unfolded fold / desktop

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: rooms = [] } = useQuery<RoomListing[]>({ queryKey: ['rooms', 'search-pool'], queryFn: () => listRoomListings().catch(() => []) });
  const { data: events = [] } = useQuery<Event[]>({ queryKey: ['events', 'search-pool'], queryFn: () => listEvents().catch(() => []) });
  const { data: market = [] } = useQuery<MarketplaceListing[]>({ queryKey: ['market', 'search-pool'], queryFn: () => listMarketplaceListings().catch(() => []) });
  const { data: jobs = [] } = useQuery<JobPosting[]>({ queryKey: ['jobs', 'search-pool'], queryFn: () => listJobPostings().catch(() => []) });

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: { id: string; title: string; subtitle: string; category: string; route: string; badge: string }[] = [];

    if (activeCategory === 'all' || activeCategory === 'rooms') {
      rooms.forEach((r: RoomListing) => {
        const loc = r.broadLocation ?? 'Austin, TX';
        if (r.title.toLowerCase().includes(q) || loc.toLowerCase().includes(q)) {
          results.push({
            id: `room-${r.id}`,
            title: r.title,
            subtitle: `${loc} · $${r.price}/mo`,
            category: 'Rooms',
            route: `/rooms/${r.id}`,
            badge: '🏠 Room',
          });
        }
      });
    }

    if (activeCategory === 'all' || activeCategory === 'events') {
      events.forEach((e: Event) => {
        if (e.title.toLowerCase().includes(q) || (e.location ?? '').toLowerCase().includes(q)) {
          results.push({
            id: `event-${e.id}`,
            title: e.title,
            subtitle: `${e.location} · ${e.date ? new Date(e.date).toLocaleDateString() : 'Upcoming'}`,
            category: 'Events',
            route: `/events/${e.id}`,
            badge: '🎉 Event',
          });
        }
      });
    }

    if (activeCategory === 'all' || activeCategory === 'market') {
      market.forEach((m: MarketplaceListing) => {
        if (m.title.toLowerCase().includes(q) || (m.location ?? '').toLowerCase().includes(q)) {
          results.push({
            id: `market-${m.id}`,
            title: m.title,
            subtitle: `${m.location ?? 'Austin'} · $${m.price}`,
            category: 'Market',
            route: `/marketplace/${m.id}`,
            badge: '🛍️ Market',
          });
        }
      });
    }

    if (activeCategory === 'all' || activeCategory === 'jobs') {
      jobs.forEach((j: JobPosting) => {
        if (j.title.toLowerCase().includes(q) || (j.company ?? '').toLowerCase().includes(q)) {
          results.push({
            id: `job-${j.id}`,
            title: j.title,
            subtitle: `${j.company ?? 'Tech Company'} · ${j.location ?? 'Austin, TX'}`,
            category: 'Jobs',
            route: `/jobs/${j.id}`,
            badge: '💼 Job',
          });
        }
      });
    }

    return results;
  }, [searchQuery, activeCategory, rooms, events, market, jobs]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.container, isDesktop && s.containerDesktop]}>
        {/* Search Header Bar */}
        <View style={s.searchBarRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={s.backBtn}
          >
            <AppIcon name="chevron-left" size={20} color={C.ink} />
          </Pressable>
          <View style={s.searchInputWrap}>
            <AppIcon name="search" size={18} color={C.inkMuted} />
            <TextInput
              style={[s.input, isCompact && s.inputCompact]}
              placeholder="Search rooms, rides, jobs, events..."
              placeholderTextColor={C.inkMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Text style={s.clearText}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.categoryBarScroll}
          contentContainerStyle={s.categoryBar}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={[s.catChip, active && s.catChipActive]}
              >
                <Text style={[s.catChipText, active && s.catChipTextActive]}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Search Results or Suggestions */}
        <ScrollView
          style={s.contentScroll}
          contentContainerStyle={s.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {searchQuery.trim().length > 0 ? (
            searchResults.length > 0 ? (
              <View style={s.resultsList}>
                <Text style={s.sectionHeader}>
                  {searchResults.length} {searchResults.length === 1 ? 'Result' : 'Results'} found
                </Text>
                {searchResults.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    onPress={() => router.push(item.route as any)}
                    style={s.resultCard}
                  >
                    <View style={s.resultBody}>
                      <View style={s.resultBadgeRow}>
                        <Text style={s.resultBadge}>{item.badge}</Text>
                      </View>
                      <Text style={s.resultTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={s.resultSub} numberOfLines={1}>{item.subtitle}</Text>
                    </View>
                    <AppIcon name="chevron-right" size={16} color={C.secondary} />
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={s.emptyState}>
                <Text style={s.emptyEmoji}>🔍</Text>
                <Text style={s.emptyTitle}>No results for "{searchQuery}"</Text>
                <Text style={s.emptySub}>Try searching with broader terms or check another category.</Text>
              </View>
            )
          ) : (
            <View style={s.suggestionsBox}>
              <Text style={s.sectionHeader}>Popular in Telugu & Desi Community</Text>
              <View style={s.popularGrid}>
                {POPULAR_SEARCHES.map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={() => {
                      setSearchQuery(item.label);
                      setActiveCategory(item.category);
                    }}
                    style={s.popularChip}
                  >
                    <AppIcon name="search" size={13} color={C.secondary} />
                    <Text style={s.popularChipText}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[s.sectionHeader, { marginTop: 24 }]}>Quick Jump</Text>
              <View style={s.quickGrid}>
                {[
                  { label: 'Explore Rooms', icon: 'home', route: '/rooms', bg: '#e8e4fb', color: '#431ebe' },
                  { label: 'Carpool Rides', icon: 'car', route: '/rides', bg: '#d9f5f5', color: '#00696b' },
                  { label: 'Tech Jobs', icon: 'briefcase', route: '/jobs', bg: '#fff0e6', color: '#ff7e33' },
                  { label: 'Festivals & Mela', icon: 'calendar', route: '/events', bg: '#fff4e0', color: '#c97a00' },
                  { label: 'Marketplace', icon: 'marketplace', route: '/marketplace', bg: '#e2f9ef', color: '#1a8a5c' },
                  { label: 'Safety & SOS', icon: 'shield', route: '/safety', bg: '#ffeaea', color: '#ba1a1a' },
                ].map((q) => (
                  <Pressable
                    key={q.label}
                    onPress={() => router.push(q.route as any)}
                    style={[s.quickCard, { backgroundColor: q.bg }]}
                  >
                    <AppIcon name={q.icon as any} size={20} color={q.color} />
                    <Text style={[s.quickCardText, { color: q.color }]}>{q.label}</Text>
                  </Pressable>
                ))}
              </View>
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
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
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
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: C.ink,
    height: '100%',
  },
  inputCompact: {
    fontSize: 12,
  },
  clearText: {
    fontSize: 14,
    color: C.inkMuted,
    fontWeight: '700',
  },
  categoryBarScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  categoryBar: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  catChip: {
    backgroundColor: C.cardBg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  catChipActive: {
    backgroundColor: C.secondary,
    borderColor: C.secondary,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.ink,
  },
  catChipTextActive: {
    color: '#FFF',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: C.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  resultsList: {
    gap: 10,
  },
  resultCard: {
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
  resultBody: {
    flex: 1,
    gap: 2,
    marginRight: 10,
  },
  resultBadgeRow: {
    marginBottom: 2,
  },
  resultBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: C.secondary,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
  },
  resultSub: {
    fontSize: 13,
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
  suggestionsBox: {
    paddingTop: 8,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  popularChipText: {
    fontSize: 13,
    color: C.ink,
    fontWeight: '500',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 14,
  },
  quickCardText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});
