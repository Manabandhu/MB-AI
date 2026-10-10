import { formatDate } from '@manabandhu/core';
import { color as baseColors, breakpoint, palette, radius } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
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
import { useAuthStore } from '@/lib/authStore';
import { listEventCategories, listEvents } from '@/modules/events/api';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const colors = {
  ...baseColors,
  canvas: '#ffffff',
  canvasMuted: '#f8f9fe',
  accentBrand: palette.primary,
  warm: palette.warm,
  inkSecondary: baseColors.muted,
  borderSubtle: palette.border,
  danger: '#ef4444',
};

const sp = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export default function EventsHomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < breakpoint.narrow;
  const _isDesktop = width >= breakpoint.medium;
  const { session } = useAuthStore();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch live events and their categories from the backend
  const {
    data: rawEvents = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['events', 'list'],
    queryFn: listEvents,
    staleTime: 1000 * 60 * 2,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['events', 'categories'],
    queryFn: listEventCategories,
    staleTime: 1000 * 60 * 10,
  });
  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id?: string) => (id ? map.get(id) : undefined);
  }, [categories]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Upcoming events only, soonest first (events without a start time go last)
  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return rawEvents
      .filter((ev) => !ev.endAt || new Date(ev.endAt).getTime() >= now)
      .slice()
      .sort((a, b) => {
        const ta = a.startAt ? new Date(a.startAt).getTime() : Number.POSITIVE_INFINITY;
        const tb = b.startAt ? new Date(b.startAt).getTime() : Number.POSITIVE_INFINITY;
        return ta - tb;
      });
  }, [rawEvents]);

  const filteredEvents = useMemo(() => {
    return upcomingEvents.filter((ev) => {
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchLoc = (ev.location || '').toLowerCase().includes(q);
        const matchDesc = (ev.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchDesc) return false;
      }
      if (selectedCategory !== 'all' && ev.categoryId !== selectedCategory) return false;
      return true;
    });
  }, [upcomingEvents, query, selectedCategory]);

  // The spotlight is simply the next upcoming event that matches the current filters.
  const featuredEvent = filteredEvents[0];
  const regularEvents = filteredEvents.slice(1);

  return (
    <View style={s.container}>
      {/* Top Header */}
      <View style={[s.topBar, isCompact && s.topBarCompact]}>
        <View style={[s.topBarLeft, isCompact && s.topBarLeftCompact]}>
          <View style={[s.brandBadge, isCompact && s.brandBadgeCompact]}>
            <Text style={[s.brandBadgeEmoji, isCompact && s.brandBadgeEmojiCompact]}>🪔</Text>
          </View>
          <View style={s.titleTextWrap}>
            <View style={s.titleRow}>
              <Text style={[s.appTitle, isCompact && s.appTitleCompact]}>ManaBandhu</Text>
              {!isCompact && (
                <View style={s.categoryPill}>
                  <Text style={s.categoryPillText}>EVENTS</Text>
                </View>
              )}
            </View>
            <Text style={s.subtitleText} numberOfLines={1}>
              {isLoading || isError
                ? 'Community events'
                : `${upcomingEvents.length} upcoming ${upcomingEvents.length === 1 ? 'event' : 'events'}`}
            </Text>
          </View>
        </View>

        <View style={[s.topBarRight, isCompact && s.topBarRightCompact]}>
          <Pressable
            onPress={() => router.push('/events/saved' as Href)}
            style={[s.iconButton, isCompact && s.iconButtonCompact]}
            accessibilityLabel="Saved Events"
          >
            <Text style={s.iconButtonEmoji}>🔖</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (!session) router.push('/sign-in' as Href);
              else router.push('/events/create' as Href);
            }}
            style={s.hostButton}
          >
            <AppIcon name="plus" size={14} color={colors.canvas} />
            <Text style={s.hostButtonText}>Host</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentBrand}
            colors={[colors.accentBrand]}
          />
        }
      >
        {/* Search Input Bar */}
        <View style={s.searchBarContainer}>
          <Text style={s.searchIconEmoji}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search events by name, place, or description..."
            placeholderTextColor={colors.inkSecondary}
            style={s.searchInput}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} style={s.clearBtn}>
              <Text style={s.clearBtnText}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Horizontal Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsScroll}
          style={s.chipsContainer}
        >
          {[{ id: 'all', name: 'All Events' }, ...categories].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[s.chipPill, isSelected && s.chipPillActive]}
              >
                <Text style={[s.chipText, isSelected && s.chipTextActive]}>{cat.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={s.loadingBox}>
            <Text style={s.loadingText}>Loading events...</Text>
          </View>
        ) : isError ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>⚠️</Text>
            <Text style={s.emptyTitle}>Unable to load events</Text>
            <Text style={s.emptySubtitle}>Check your connection and try again.</Text>
            <Pressable onPress={() => refetch()} style={s.resetBtn}>
              <Text style={s.resetBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : !featuredEvent ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>🎉</Text>
            <Text style={s.emptyTitle}>
              {upcomingEvents.length === 0 ? 'No upcoming events yet' : 'No events found'}
            </Text>
            <Text style={s.emptySubtitle}>
              {upcomingEvents.length === 0
                ? 'Host one to get the community together.'
                : 'Try searching for a different keyword or category.'}
            </Text>
            <Pressable
              onPress={() => {
                setQuery('');
                setSelectedCategory('all');
              }}
              style={s.resetBtn}
            >
              <Text style={s.resetBtnText}>View All Events</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Next upcoming event spotlight (first real event in the filtered list) */}
            <View style={s.featuredCard}>
              <View style={s.featuredHeaderBg}>
                <View style={s.featuredBadgeRow}>
                  <View style={s.featuredTagPill}>
                    <Text style={s.featuredTagText}>
                      🎉 NEXT UP
                      {categoryName(featuredEvent.categoryId)
                        ? ` • ${categoryName(featuredEvent.categoryId)?.toUpperCase()}`
                        : ''}
                    </Text>
                  </View>
                </View>

                <Text style={s.featuredTitle}>{featuredEvent.title}</Text>
                <Text style={s.featuredDate}>
                  📅 {formatDate(featuredEvent.startAt, 'weekdayTime') ?? 'Date to be announced'}
                </Text>
                <Text style={s.featuredLocation}>📍 {featuredEvent.location}</Text>
              </View>

              <View style={s.featuredFooter}>
                <Pressable
                  onPress={() => router.push(`/events/${featuredEvent.id}` as Href)}
                  style={s.rsvpSpotlightBtn}
                >
                  <Text style={s.rsvpSpotlightBtnText}>View & RSVP 🪔</Text>
                </Pressable>
              </View>
            </View>

            {regularEvents.length > 0 ? (
              <>
                <View style={s.sectionHeaderRow}>
                  <Text style={s.sectionTitle}>More upcoming ({regularEvents.length})</Text>
                </View>
                <View style={s.eventsGrid}>
                  {regularEvents.map((event) => {
                    const category = categoryName(event.categoryId);
                    return (
                      <View key={event.id} style={s.eventCard}>
                        {category ? (
                          <View style={s.cardTopRow}>
                            <View style={s.categoryTagPill}>
                              <Text style={s.categoryTagText}>{category}</Text>
                            </View>
                          </View>
                        ) : null}

                        <Pressable onPress={() => router.push(`/events/${event.id}` as Href)}>
                          <Text style={s.cardTitle}>{event.title}</Text>
                        </Pressable>

                        <Text style={s.cardDate}>
                          📅 {formatDate(event.startAt, 'weekdayTime') ?? 'Date to be announced'}
                        </Text>
                        <Text style={s.cardLocation}>📍 {event.location}</Text>
                        {event.description ? (
                          <Text numberOfLines={2} style={s.cardLocation}>
                            {event.description}
                          </Text>
                        ) : null}

                        <View style={s.cardActionsRow}>
                          <Pressable
                            onPress={() => router.push(`/events/${event.id}` as Href)}
                            style={s.viewDetailsBtn}
                          >
                            <Text style={s.viewDetailsText}>View Details ↗</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null}
          </>
        )}

        {/* Community Host Banner */}
        <View style={s.hostPromptBanner}>
          <Text style={s.hostPromptEmoji}>📢</Text>
          <View style={s.hostPromptContent}>
            <Text style={s.hostPromptTitle}>Hosting a Community Event?</Text>
            <Text style={s.hostPromptSubtitle}>
              Publish your festival puja, cricket match, garba night, or tech meetup for the
              community.
            </Text>
          </View>
          <Pressable
            onPress={() => {
              if (!session) router.push('/sign-in' as Href);
              else router.push('/events/create' as Href);
            }}
            style={s.createEventBannerBtn}
          >
            <Text style={s.createEventBannerBtnText}>Create Event</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fe',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: sp.md,
    paddingBottom: sp.md,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: 8,
  },
  topBarLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.card,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeEmoji: {
    fontSize: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.sm,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  categoryPill: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: sp.xs,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ea580c',
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSecondary,
    marginTop: 2,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasMuted,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconButtonEmoji: {
    fontSize: 16,
  },
  hostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentBrand,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  hostButtonText: {
    color: colors.canvas,
    fontSize: 13,
    fontWeight: '700',
  },
  topBarCompact: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  topBarLeftCompact: {
    gap: 8,
  },
  brandBadgeCompact: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  brandBadgeEmojiCompact: {
    fontSize: 18,
  },
  titleTextWrap: {
    flexShrink: 1,
  },
  appTitleCompact: {
    fontSize: 15,
  },
  topBarRightCompact: {
    gap: 6,
  },
  iconButtonCompact: {
    width: 34,
    height: 34,
  },
  scrollContent: {
    padding: sp.lg,
    paddingBottom: 110,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.canvas,
    borderRadius: radius.control,
    paddingHorizontal: sp.md,
    height: 46,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: sp.md,
  },
  searchIconEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 14,
    color: colors.inkSecondary,
    fontWeight: '700',
  },
  chipsContainer: {
    marginBottom: sp.lg,
  },
  chipsScroll: {
    gap: sp.sm,
  },
  chipPill: {
    paddingHorizontal: sp.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  chipPillActive: {
    backgroundColor: colors.accentBrand,
    borderColor: colors.accentBrand,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  chipTextActive: {
    color: colors.canvas,
    fontWeight: '700',
  },
  featuredCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.panel,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    shadowColor: '#f97316',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: sp.xl,
  },
  featuredHeaderBg: {
    backgroundColor: '#fff7ed',
    padding: sp.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp.sm,
  },
  featuredTagPill: {
    backgroundColor: '#ea580c',
    paddingHorizontal: sp.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  featuredTagText: {
    color: colors.canvas,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuredTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#7c2d12',
    letterSpacing: -0.5,
    marginBottom: sp.xs,
  },
  featuredDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#c2410c',
    marginBottom: 2,
  },
  featuredLocation: {
    fontSize: 12,
    color: '#9a3412',
  },
  featuredFooter: {
    padding: sp.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.canvas,
    flexWrap: 'wrap',
    gap: sp.sm,
  },
  rsvpSpotlightBtn: {
    backgroundColor: '#ea580c',
    paddingHorizontal: sp.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  rsvpSpotlightBtnText: {
    color: colors.canvas,
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  loadingBox: {
    padding: sp.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.inkSecondary,
  },
  emptyBox: {
    backgroundColor: colors.canvas,
    borderRadius: radius.card,
    padding: sp.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: sp.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.inkSecondary,
    textAlign: 'center',
    marginBottom: sp.md,
  },
  resetBtn: {
    backgroundColor: colors.accentBrand,
    paddingHorizontal: sp.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  resetBtnText: {
    color: colors.canvas,
    fontSize: 12,
    fontWeight: '700',
  },
  eventsGrid: {
    gap: sp.md,
  },
  eventCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.card,
    padding: sp.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp.xs,
  },
  categoryTagPill: {
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6d28d9',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
    marginBottom: 2,
  },
  cardLocation: {
    fontSize: 12,
    color: colors.inkSecondary,
    marginBottom: sp.sm,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.sm,
  },
  viewDetailsBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  hostPromptBanner: {
    marginTop: sp.xl,
    backgroundColor: '#ede9fe',
    borderRadius: radius.panel,
    padding: sp.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.md,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  hostPromptEmoji: {
    fontSize: 28,
  },
  hostPromptContent: {
    flex: 1,
  },
  hostPromptTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4c1d95',
    marginBottom: 2,
  },
  hostPromptSubtitle: {
    fontSize: 11,
    color: '#6d28d9',
    lineHeight: 16,
  },
  createEventBannerBtn: {
    backgroundColor: colors.accentBrand,
    paddingHorizontal: sp.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  createEventBannerBtnText: {
    color: colors.canvas,
    fontSize: 12,
    fontWeight: '700',
  },
});
