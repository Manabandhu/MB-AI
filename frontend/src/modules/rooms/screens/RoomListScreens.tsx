import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  archiveRoomListing,
  getFavorites,
  getMyListings,
  pauseRoomListing,
  publishRoomListing,
  unsaveRoom,
} from '@/modules/rooms/api';
import type { RoomListing } from '@/modules/rooms/types';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

// Demo saved listings shown when unauthenticated or offline
const defaultSavedRooms: RoomListing[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    ownerId: 'b2e63b49-91df-49e0-bf8f-f32822f883a5',
    title: 'Spacious Private Room in 2B2B Luxury Apartment',
    description: 'Master bedroom with private attached bath, walk-in closet, and balcony view in Domain Northside. High-speed fiber WiFi and all utilities included.',
    price: 780,
    roomType: 'Private Room',
    status: 'ACTIVE',
    broadLocation: 'Domain Northside, Austin, TX · Walk to Apple Riata',
    amenities: ['Private Bath', 'In-unit W/D', 'Covered Parking', 'High-Speed WiFi'],
    preferences: ['Vegetarian Kitchen Preferred', 'Working Professional'],
    savedByViewer: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    ownerId: '09738cc8-7e22-49e4-9c2b-be1040fe6438',
    title: 'Sunlit 1BHK Studio Apartment near UT Austin',
    description: 'Fully furnished 1BHK studio with modern modular kitchen, hardwood floors, and study desk.',
    price: 920,
    roomType: '1BHK Studio',
    status: 'ACTIVE',
    broadLocation: 'West Campus, Austin, TX · 5 mins to UT Austin',
    amenities: ['Furnished', 'Private Kitchen', 'Central AC'],
    preferences: ['Student / Grad Friendly', 'Vegetarian Friendly'],
    savedByViewer: true,
    createdAt: '2026-09-02T00:00:00Z',
    updatedAt: '2026-09-02T00:00:00Z',
  },
];

export function RoomFavoritesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [removedIds, setRemovedIds] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['rooms', 'favorites'],
    queryFn: getFavorites,
    retry: false,
  });

  const unsave = useMutation({
    mutationFn: (roomId: string) => unsaveRoom(roomId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', 'favorites'] }),
  });

  // Fallback to default saved rooms if unauthenticated or empty initial demo
  const allSaved = (data && data.length > 0 ? data : defaultSavedRooms).filter(
    (room) => !removedIds[room.id],
  );

  const handleUnsave = (id: string) => {
    setRemovedIds((prev) => ({ ...prev, [id]: true }));
    unsave.mutate(id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header with Back Navigation */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityLabel="Back to Rooms"
            onPress={() => router.push('/rooms' as Href)}
            style={styles.backBtn}
          >
            <AppIcon color="#1a1c28" name="chevron-left" size={20} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Saved Rooms</Text>
            <Text style={styles.headerSubtitle}>Compare your shortlisted listings</Text>
          </View>
        </View>
        <View style={styles.savedCountPill}>
          <Text style={styles.savedCountText}>{allSaved.length} Saved</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {allSaved.length > 0 ? (
          <View style={styles.listGrid}>
            {allSaved.map((room) => (
              <SavedRoomCard
                key={room.id}
                room={room}
                onUnsave={() => handleUnsave(room.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>❤️</Text>
            <Text style={styles.emptyTitle}>No saved rooms yet</Text>
            <Text style={styles.emptyBody}>
              Bookmark rooms while exploring to easily compare rent, amenities, and locations here.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/rooms' as Href)}
              style={styles.exploreBtn}
            >
              <Text style={styles.exploreBtnText}>Browse Available Rooms</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SavedRoomCard({
  room,
  onUnsave,
}: {
  room: RoomListing;
  onUnsave: () => void;
}) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/rooms/${room.id}` as Href)}
      style={styles.savedCard}
    >
      <View style={styles.cardHeader}>
        <View style={styles.thumbBox}>
          <Text style={styles.thumbEmoji}>🛏️</Text>
          <View style={styles.pricePill}>
            <Text style={styles.priceValue}>${room.price}</Text>
            <Text style={styles.pricePeriod}>/mo</Text>
          </View>
        </View>

        <View style={styles.cardHeaderInfo}>
          <View style={styles.cardTypeRow}>
            <View style={styles.roomTypeBadge}>
              <Text style={styles.roomTypeBadgeText}>{room.roomType}</Text>
            </View>
            <Pressable
              accessibilityLabel="Remove from saved"
              onPress={(e) => {
                e.stopPropagation();
                onUnsave();
              }}
              style={styles.unsaveBtn}
            >
              <Text style={styles.heartActive}>❤️</Text>
            </Pressable>
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {room.title}
          </Text>

          <View style={styles.locationRow}>
            <AppIcon color="#747688" name="map" size={13} />
            <Text style={styles.locationText} numberOfLines={1}>
              {room.broadLocation}
            </Text>
          </View>
        </View>
      </View>

      {/* Preferences / Tags */}
      <View style={styles.tagsRow}>
        {(room.preferences ?? []).slice(0, 2).map((pref) => (
          <View key={pref} style={styles.tagPill}>
            <Text style={styles.tagPillText}>{pref}</Text>
          </View>
        ))}
        {(room.amenities ?? []).slice(0, 2).map((amenity) => (
          <View key={amenity} style={styles.amenityTagPill}>
            <Text style={styles.amenityTagPillText}>{amenity}</Text>
          </View>
        ))}
      </View>

      {/* Card Actions */}
      <View style={styles.cardFooter}>
        <View style={styles.hostTrustRow}>
          <View style={styles.verifiedDot} />
          <Text style={styles.hostTrustText}>Verified Host · Direct Contact</Text>
        </View>
        <View style={styles.ctaRow}>
          <Link href={`/rooms/${room.id}/inquiry` as Href} asChild>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={StyleSheet.flatten(styles.inquireBtn)}
            >
              <Text style={styles.inquireBtnText}>Inquire</Text>
            </Pressable>
          </Link>
          <Link href={`/rooms/${room.id}` as Href} asChild>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={StyleSheet.flatten(styles.viewBtn)}
            >
              <Text style={styles.viewBtnText}>View Details →</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </Pressable>
  );
}

export function RoomMyListingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['rooms', 'my-listings'],
    queryFn: getMyListings,
    retry: false,
  });

  const listings = data ?? [];

  const publish = useMutation({
    mutationFn: publishRoomListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', 'my-listings'] }),
  });

  const pause = useMutation({
    mutationFn: pauseRoomListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', 'my-listings'] }),
  });

  const archive = useMutation({
    mutationFn: archiveRoomListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', 'my-listings'] }),
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityLabel="Back to Rooms"
            onPress={() => router.push('/rooms' as Href)}
            style={styles.backBtn}
          >
            <AppIcon color="#1a1c28" name="chevron-left" size={20} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>My Listings</Text>
            <Text style={styles.headerSubtitle}>Manage your posted rooms & inquiries</Text>
          </View>
        </View>
        <Link href="/rooms/create-listing" asChild>
          <Pressable style={StyleSheet.flatten(styles.createListingBtnSmall)}>
            <AppIcon color="#fff" name="plus" size={16} />
            <Text style={styles.createListingBtnSmallText}>Post Room</Text>
          </Pressable>
        </Link>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {listings.length > 0 ? (
          <View style={styles.listGrid}>
            {listings.map((listing) => (
              <View key={listing.id} style={styles.myListingCard}>
                <View style={styles.cardHeaderInfo}>
                  <View style={styles.cardTypeRow}>
                    <Text style={styles.statusBadge}>{listing.status}</Text>
                    <Text style={styles.priceValue}>${listing.price}/mo</Text>
                  </View>
                  <Text style={styles.cardTitle}>{listing.title}</Text>
                  <Text style={styles.locationText}>{listing.broadLocation}</Text>
                </View>

                <View style={styles.actionButtonGroup}>
                  <AppButton
                    label="Edit"
                    onPress={() => router.push(`/rooms/${listing.id}/edit` as Href)}
                    variant="secondary"
                  />
                  {listing.status === 'DRAFT' ? (
                    <AppButton
                      label="Publish"
                      onPress={() => publish.mutate(listing.id)}
                      loading={publish.isPending}
                      variant="primary"
                    />
                  ) : listing.status === 'ACTIVE' ? (
                    <AppButton
                      label="Pause"
                      onPress={() => pause.mutate(listing.id)}
                      loading={pause.isPending}
                      variant="secondary"
                    />
                  ) : listing.status === 'PAUSED' ? (
                    <AppButton
                      label="Publish"
                      onPress={() => publish.mutate(listing.id)}
                      loading={publish.isPending}
                      variant="primary"
                    />
                  ) : null}
                  <AppButton
                    label="Archive"
                    onPress={() => archive.mutate(listing.id)}
                    loading={archive.isPending}
                    variant="ghost"
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏡</Text>
            <Text style={styles.emptyTitle}>No listings posted yet</Text>
            <Text style={styles.emptyBody}>
              Have a spare room or leasing an apartment? Reach thousands of verified flatmates today.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/rooms/create-listing' as Href)}
              style={styles.exploreBtn}
            >
              <Text style={styles.exploreBtnText}>Post a Room Listing</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f7fb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaedff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f2f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1c28',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#747688',
    marginTop: 1,
  },
  savedCountPill: {
    backgroundColor: 'rgba(67,30,190,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  savedCountText: {
    color: '#431ebe',
    fontSize: 12,
    fontWeight: '800',
  },
  createListingBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#431ebe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  createListingBtnSmallText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  guaranteeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,105,107,0.06)',
    paddingVertical: 8,
    paddingHorizontal: space.x4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,105,107,0.12)',
  },
  guaranteeBannerText: {
    color: '#00696b',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: space.x4,
    paddingBottom: 80,
  },
  listGrid: {
    gap: space.x3,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  savedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: space.x4,
    borderWidth: 1,
    borderColor: '#e8eaf6',
    gap: space.x3,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: space.x3,
  },
  thumbBox: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: '#f2f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbEmoji: {
    fontSize: 34,
  },
  pricePill: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: '#431ebe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  pricePeriod: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
  },
  cardHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  cardTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomTypeBadge: {
    backgroundColor: 'rgba(67,30,190,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roomTypeBadgeText: {
    color: '#431ebe',
    fontSize: 11,
    fontWeight: '700',
  },
  unsaveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff0f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartActive: {
    fontSize: 15,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1c28',
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#747688',
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: 'rgba(0,105,107,0.07)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagPillText: {
    color: '#00696b',
    fontSize: 11,
    fontWeight: '600',
  },
  amenityTagPill: {
    backgroundColor: '#f2f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  amenityTagPillText: {
    color: '#5b3fd6',
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.x2,
    borderTopWidth: 1,
    borderTopColor: '#f2f3ff',
  },
  hostTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00696b',
  },
  hostTrustText: {
    color: '#00696b',
    fontSize: 11,
    fontWeight: '600',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
  },
  inquireBtn: {
    backgroundColor: '#f2f3ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  inquireBtnText: {
    color: '#431ebe',
    fontSize: 12,
    fontWeight: '700',
  },
  viewBtn: {
    backgroundColor: '#431ebe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  viewBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: space.x6,
    gap: space.x2,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: space.x2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1c28',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 13,
    color: '#747688',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
    marginBottom: space.x3,
  },
  exploreBtn: {
    backgroundColor: '#431ebe',
    paddingHorizontal: space.x5,
    paddingVertical: space.x3,
    borderRadius: radius.pill,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  myListingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: space.x4,
    borderWidth: 1,
    borderColor: '#e8eaf6',
    gap: space.x3,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00696b',
    backgroundColor: 'rgba(0,105,107,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  actionButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.x2,
    borderTopWidth: 1,
    borderTopColor: '#f2f3ff',
    paddingTop: space.x3,
  },
});
