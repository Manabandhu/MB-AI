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
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRoomsScreen, listRoomListings } from '@/modules/rooms/api';
import { roomScreenFallbacks } from '@/modules/rooms/roomsFallbacks';
import type { RoomListing } from '@/modules/rooms/types';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const colors = {
  ...baseColors,
  appPrimary: '#431ebe',
  primaryContainer: '#5b3fd6',
  surfaceContainer: '#eaedff',
  surfaceContainerLow: '#f2f3ff',
  warm: '#ff7e33',
  teal: '#00696b',
  tealSoft: 'rgba(0,105,107,0.08)',
  indigoSoft: 'rgba(67,30,190,0.07)',
  orangeSoft: 'rgba(255,126,51,0.10)',
};

export type RoomsScreenId =
  | 'home'
  | 'search'
  | 'map'
  | 'filters'
  | 'saved'
  | 'my-listings'
  | 'create-listing'
  | 'details'
  | 'edit';

type RoomsScreenProps = {
  screenId: RoomsScreenId;
};

// ─── Fallback Sample Listings for Rich Preview ─────────────────────────────────
const fallbackRooms: RoomListing[] = [
  {
    id: 'room-1',
    ownerId: 'owner-1',
    title: 'Spacious Private Room in 2B2B Luxury Apartment',
    description: 'Master bedroom with private attached bath, walk-in closet, and balcony view in Domain Northside. High-speed fiber WiFi and all utilities included.',
    price: 780,
    roomType: 'Private Room',
    status: 'ACTIVE',
    broadLocation: 'Domain Northside, Austin, TX · Walk to Apple Riata',
    amenities: ['Private Bath', 'In-unit W/D', 'Covered Parking', 'High-Speed WiFi', 'Gym & Pool'],
    preferences: ['Vegetarian Kitchen Preferred', 'Working Professional', 'Non-Smoker', 'Quiet Hours'],
    savedByViewer: false,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'room-2',
    ownerId: 'owner-2',
    title: 'Sunlit 1BHK Studio Apartment near UT Austin',
    description: 'Fully furnished 1BHK studio with modern modular kitchen, hardwood floors, and study desk. CapMetro bus stop right outside.',
    price: 920,
    roomType: '1BHK Studio',
    status: 'ACTIVE',
    broadLocation: 'West Campus, Austin, TX · 5 mins to UT Austin',
    amenities: ['Furnished', 'Private Kitchen', 'Central AC', 'Bike Storage'],
    preferences: ['Student / Grad Friendly', 'Vegetarian Friendly', 'Immediate Move-in'],
    savedByViewer: true,
    createdAt: '2026-09-02T00:00:00Z',
    updatedAt: '2026-09-02T00:00:00Z',
  },
  {
    id: 'room-3',
    ownerId: 'owner-3',
    title: 'Shared 2B2B Townhouse Room with Tech Roommates',
    description: 'Cozy shared room in quiet cul-de-sac. Living with two senior SWEs (Google & Meta). Indian grocery stores and Patel Brothers 5 mins away.',
    price: 650,
    roomType: 'Shared Room',
    status: 'ACTIVE',
    broadLocation: 'Round Rock / Brushy Creek, Austin, TX',
    amenities: ['Shared Bath', 'Fiber Internet', 'Backyard Lawn', 'Free Parking'],
    preferences: ['Pure Veg Kitchen', 'Telugu / Hindi Speaking', 'Non-Smoker'],
    savedByViewer: false,
    createdAt: '2026-09-03T00:00:00Z',
    updatedAt: '2026-09-03T00:00:00Z',
  },
  {
    id: 'room-4',
    ownerId: 'owner-4',
    title: 'Private Master Bed with Bath in Cedar Park Home',
    description: 'Large master suite in brand new single-family house. Peaceful neighborhood, ideal for working professionals working in North Austin tech corridor.',
    price: 850,
    roomType: 'Private Room',
    status: 'ACTIVE',
    broadLocation: 'Cedar Park, Austin, TX · 10 mins to Dell Campus',
    amenities: ['Private Bath', 'Attached Balcony', 'EV Charging', 'Washer/Dryer'],
    preferences: ['Female Only', 'Veg Preferred', 'Working Professional'],
    savedByViewer: false,
    createdAt: '2026-09-04T00:00:00Z',
    updatedAt: '2026-09-04T00:00:00Z',
  },
];

const filterCategories = [
  'All (847)',
  'Private Room',
  'Shared 2B2B',
  '1BHK Studio',
  'Veg Kitchen 🥦',
  'Girls Only 👩',
  'Near Apple / UT 📍',
  'Furnished 🛏️',
  'Immediate Move-in ⚡',
];

export function RoomsScreen({ screenId }: RoomsScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All (847)');
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({ 'room-2': true });

  // Query real API listings, fallback to sample listings
  const { data: listings } = useQuery({
    queryKey: ['rooms', 'listings'],
    queryFn: () => listRoomListings(),
    retry: false,
  });

  const roomsList = listings && listings.length > 0 ? listings : fallbackRooms;

  // Filter listings based on active filter
  const filteredRooms = roomsList.filter((room) => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchTitle = room.title.toLowerCase().includes(q);
      const matchLoc = (room.broadLocation ?? '').toLowerCase().includes(q);
      if (!matchTitle && !matchLoc) return false;
    }

    if (activeCategory === 'Private Room') return room.roomType === 'Private Room';
    if (activeCategory === 'Shared 2B2B') return room.roomType.includes('Shared') || room.title.includes('2B2B');
    if (activeCategory === '1BHK Studio') return room.roomType.includes('1BHK') || room.roomType.includes('Studio');
    if (activeCategory === 'Veg Kitchen 🥦') {
      return (room.preferences ?? []).some((p) => p.toLowerCase().includes('veg'));
    }
    if (activeCategory === 'Girls Only 👩') {
      return (room.preferences ?? []).some((p) => p.toLowerCase().includes('female') || p.toLowerCase().includes('girls'));
    }
    return true;
  });

  const toggleSave = (id: string) => {
    setSavedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView style={s.safeArea}>
      {/* ─── Top Header ───────────────────────────────────────────────────────── */}
      <View style={[s.header, isDesktop && s.headerDesktop]}>
        <View style={s.headerTop}>
          <Pressable onPress={() => router.push('/home')} style={s.backBtn} accessibilityLabel="Go to Home">
            <AppIcon color={colors.ink} name="chevron-left" size={20} />
          </Pressable>
          <Pressable onPress={() => router.push('/rooms/search')} style={s.locationSelector}>
            <AppIcon color={colors.appPrimary} name="map" size={14} />
            <Text style={s.locationTitle}>Austin, TX · 847 Rooms</Text>
            <AppIcon color={colors.muted} name="chevron-down" size={14} />
          </Pressable>
          <View style={s.headerActions}>
            <Link href="/rooms/saved" asChild>
              <Pressable
                accessibilityLabel="Saved Rooms"
                style={StyleSheet.flatten(s.iconBtn)}
              >
                <AppIcon color={colors.appPrimary} name="star" size={18} />
              </Pressable>
            </Link>
            <Link href="/rooms/create-listing" asChild>
              <Pressable
                accessibilityLabel="Post a Room"
                style={StyleSheet.flatten(s.postRoomBtnSmall)}
              >
                <AppIcon color="#fff" name="plus" size={16} />
                {isDesktop ? <Text style={s.postRoomBtnSmallText}>Post Room</Text> : null}
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Search Bar */}
        <View style={s.searchBarContainer}>
          <AppIcon color={colors.muted} name="search" size={18} />
          <TextInput
            placeholder="Search by area, campus, or tech park..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={s.searchInput}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} style={s.clearBtn}>
              <Text style={s.clearBtnText}>✕</Text>
            </Pressable>
          ) : null}
          <Link href="/rooms/filters" asChild>
            <Pressable
              accessibilityLabel="Filters"
              style={StyleSheet.flatten(s.filterPillBtn)}
            >
              <AppIcon color={colors.appPrimary} name="wrench" size={14} />
            </Pressable>
          </Link>
        </View>

        {/* Filter Categories Chips Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {filterCategories.map((cat) => {
            const active = activeCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[s.filterChip, active && s.filterChipActive]}
              >
                <Text style={[s.filterChipText, active && s.filterChipTextActive]}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Scrollable Feed Content ──────────────────────────────────────────── */}
      <ScrollView contentContainerStyle={[s.content, isDesktop && s.contentDesktop]} showsVerticalScrollIndicator={false}>
        {/* Zero Brokerage Community Trust Banner */}
        <View style={s.trustBanner}>
          <View style={s.trustBadgeIcon}>
            <AppIcon color="#fff" name="shield" size={18} />
          </View>
          <View style={s.trustBannerContent}>
            <View style={s.trustBannerHeader}>
              <Text style={s.trustBannerTitle}>Direct Community Listings • Zero Brokerage</Text>
              <View style={s.verifiedTag}>
                <AppIcon color={colors.teal} name="check" size={10} strokeWidth={3} />
                <Text style={s.verifiedTagText}>100% Verified</Text>
              </View>
            </View>
            <Text style={s.trustBannerSubtitle}>
              Connect directly with verified Desi flatmates & landlords. No broker charges or middlemen fees.
            </Text>
          </View>
        </View>

        {/* Featured Subleases Carousel */}
        <View style={s.sectionHeader}>
          <View>
            <Text style={s.sectionTitle}>Featured Subleases & Rooms</Text>
            <Text style={s.sectionSub}>Hand-picked verified housing near major employers</Text>
          </View>
          <Link href="/rooms/search" asChild>
            <Pressable accessibilityRole="link"><Text style={s.seeAllText}>View All →</Text></Pressable>
          </Link>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.featuredScroll}>
          {roomsList.slice(0, 3).map((room) => (
            <Pressable
              key={room.id}
              onPress={() => router.push(`/rooms/${room.id}` as Href)}
              style={s.featuredCard}
            >
              <View style={s.featuredThumb}>
                <Text style={s.featuredThumbEmoji}>🏢</Text>
                <View style={s.featuredPricePill}>
                  <Text style={s.featuredPriceText}>${room.price}/mo</Text>
                </View>
                <View style={s.featuredBadgePill}>
                  <Text style={s.featuredBadgeText}>{room.roomType}</Text>
                </View>
              </View>
              <View style={s.featuredCardInfo}>
                <Text style={s.featuredCardTitle} numberOfLines={1}>{room.title}</Text>
                <View style={s.featuredMetaRow}>
                  <AppIcon color={colors.muted} name="map" size={12} />
                  <Text style={s.featuredLocationText} numberOfLines={1}>{room.broadLocation}</Text>
                </View>
                <View style={s.featuredHostRow}>
                  <View style={s.hostAvatarMini}>
                    <Text style={s.hostAvatarMiniText}>VR</Text>
                  </View>
                  <Text style={s.hostNameMini}>Verified Desi Host</Text>
                  <View style={s.ratingChip}>
                    <AppIcon color="#ff9500" name="star" size={10} />
                    <Text style={s.ratingChipText}>4.9</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Available Rooms Feed */}
        <View style={s.sectionHeader}>
          <View>
            <Text style={s.sectionTitle}>Available Rooms ({filteredRooms.length})</Text>
            <Text style={s.sectionSub}>Active listings in Austin & surrounding tech areas</Text>
          </View>
          <Link href="/rooms/map" asChild>
            <Pressable style={s.mapToggleBtn} accessibilityRole="link">
              <AppIcon color={colors.appPrimary} name="map" size={14} />
              <Text style={s.mapToggleText}>Map View</Text>
            </Pressable>
          </Link>
        </View>

        {filteredRooms.map((room) => {
          const isSaved = savedIds[room.id] || room.savedByViewer;
          return (
            <Pressable
              key={room.id}
              onPress={() => router.push(`/rooms/${room.id}` as Href)}
              style={s.roomFeedCard}
            >
              <View style={s.roomCardHeader}>
                <View style={s.roomCardThumb}>
                  <Text style={s.roomCardEmoji}>🛏️</Text>
                  <View style={s.roomCardPriceBadge}>
                    <Text style={s.roomCardPriceVal}>${room.price}</Text>
                    <Text style={s.roomCardPricePeriod}>/mo</Text>
                  </View>
                </View>
                <View style={s.roomCardMain}>
                  <View style={s.roomCardTopRow}>
                    <View style={s.roomTypeTag}>
                      <Text style={s.roomTypeTagText}>{room.roomType}</Text>
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleSave(room.id);
                      }}
                      style={s.saveBtn}
                    >
                      <AppIcon
                        color={isSaved ? '#ba1a1a' : colors.muted}
                        name="star"
                        size={18}
                      />
                    </Pressable>
                  </View>

                  <Text style={s.roomCardTitle} numberOfLines={2}>{room.title}</Text>
                  <View style={s.roomCardLocationRow}>
                    <AppIcon color={colors.muted} name="map" size={12} />
                    <Text style={s.roomCardLocationText} numberOfLines={1}>{room.broadLocation}</Text>
                  </View>
                </View>
              </View>

              {/* Preference / Amenity Tags */}
              <View style={s.chipsRow}>
                {(room.preferences ?? []).slice(0, 2).map((pref) => (
                  <View key={pref} style={s.amenityChip}>
                    <Text style={s.amenityChipText}>{pref}</Text>
                  </View>
                ))}
                {(room.amenities ?? []).slice(0, 2).map((amenity) => (
                  <View key={amenity} style={s.featureChip}>
                    <Text style={s.featureChipText}>{amenity}</Text>
                  </View>
                ))}
              </View>

              {/* Footer with Host Info & CTAs */}
              <View style={s.roomCardFooter}>
                <View style={s.hostInfo}>
                  <View style={s.hostAvatar}>
                    <Text style={s.hostAvatarText}>{room.title[0] || 'M'}</Text>
                  </View>
                  <View>
                    <Text style={s.hostName}>Verified Landlord</Text>
                    <Text style={s.hostMeta}>Zero Brokerage · Fast Reply</Text>
                  </View>
                </View>

                <View style={s.cardActions}>
                  <Link href={`/rooms/${room.id}/inquiry` as Href} asChild>
                    <Pressable
                      onPress={(e) => e.stopPropagation()}
                      style={StyleSheet.flatten(s.inquireBtn)}
                    >
                      <Text style={s.inquireBtnText}>Inquire</Text>
                    </Pressable>
                  </Link>
                  <Link href={`/rooms/${room.id}` as Href} asChild>
                    <Pressable
                      onPress={(e) => e.stopPropagation()}
                      style={StyleSheet.flatten(s.viewDetailsBtn)}
                    >
                      <Text style={s.viewDetailsBtnText}>Details →</Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ─── Floating Action Button: Post Room ─────────────────────────────────── */}
      <Link href="/rooms/create-listing" asChild>
        <Pressable
          accessibilityLabel="Post a room"
          accessibilityRole="button"
          style={StyleSheet.flatten(s.fab)}
        >
          <AppIcon color="#fff" name="plus" size={20} />
          <Text style={s.fabText}>Post Room</Text>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  header: {
    backgroundColor: 'rgba(250,248,255,0.98)',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: space.x4,
    paddingTop: space.x2,
    paddingBottom: space.x3,
    gap: space.x2,
  },
  headerDesktop: {
    paddingHorizontal: space.x8,
    paddingVertical: space.x4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerLow,
    borderColor: 'rgba(67,30,190,0.15)',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.x3,
    paddingVertical: 6,
  },
  locationTitle: {
    color: colors.appPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postRoomBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.appPrimary,
    borderRadius: radius.pill,
    paddingHorizontal: space.x3,
    paddingVertical: 7,
  },
  postRoomBtnSmallText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(67,30,190,0.15)',
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: space.x3,
    height: 46,
    gap: space.x2,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '500',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.indigoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: space.x2,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: space.x3,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.appPrimary,
    borderColor: colors.appPrimary,
  },
  filterChipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  content: {
    padding: space.x4,
    gap: space.x4,
    paddingBottom: 110,
  },
  contentDesktop: {
    paddingHorizontal: space.x8,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.x3,
    backgroundColor: 'rgba(67,30,190,0.05)',
    borderColor: 'rgba(67,30,190,0.18)',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: space.x4,
  },
  trustBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.appPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustBannerContent: {
    flex: 1,
    gap: 4,
  },
  trustBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  trustBannerTitle: {
    color: colors.appPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tealSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  verifiedTagText: {
    color: colors.teal,
    fontSize: 10,
    fontWeight: '800',
  },
  trustBannerSubtitle: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.x1,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSub: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  seeAllText: {
    color: colors.appPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  mapToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerLow,
    borderColor: 'rgba(67,30,190,0.15)',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.x3,
    paddingVertical: 6,
  },
  mapToggleText: {
    color: colors.appPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  featuredScroll: {
    gap: space.x3,
    paddingVertical: 2,
  },
  featuredCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  featuredThumb: {
    height: 110,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  featuredThumbEmoji: {
    fontSize: 42,
  },
  featuredPricePill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: colors.appPrimary,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  featuredPriceText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  featuredBadgePill: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  featuredBadgeText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '700',
  },
  featuredCardInfo: {
    padding: space.x3,
    gap: 4,
  },
  featuredCardTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  featuredMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredLocationText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  featuredHostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  hostAvatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.appPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarMiniText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  hostNameMini: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingChipText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  roomFeedCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: space.x4,
    gap: space.x3,
  },
  roomCardHeader: {
    flexDirection: 'row',
    gap: space.x3,
  },
  roomCardThumb: {
    width: 84,
    height: 84,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  roomCardEmoji: {
    fontSize: 34,
  },
  roomCardPriceBadge: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: colors.appPrimary,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  roomCardPriceVal: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  roomCardPricePeriod: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: '600',
  },
  roomCardMain: {
    flex: 1,
    gap: 4,
  },
  roomCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomTypeTag: {
    backgroundColor: colors.indigoSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roomTypeTagText: {
    color: colors.appPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
  saveBtn: {
    padding: 4,
  },
  roomCardTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  roomCardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomCardLocationText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityChip: {
    backgroundColor: 'rgba(0,105,107,0.07)',
    borderColor: 'rgba(0,105,107,0.15)',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  amenityChipText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: '700',
  },
  featureChip: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  featureChipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  roomCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.x2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.appPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  hostName: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  hostMeta: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
  },
  inquireBtn: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.appPrimary,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: space.x3,
    paddingVertical: 6,
  },
  inquireBtnText: {
    color: colors.appPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  viewDetailsBtn: {
    backgroundColor: colors.appPrimary,
    borderRadius: radius.pill,
    paddingHorizontal: space.x3,
    paddingVertical: 6,
  },
  viewDetailsBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    bottom: space.x6,
    right: space.x4,
    backgroundColor: colors.appPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    borderRadius: radius.pill,
    shadowColor: colors.appPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
