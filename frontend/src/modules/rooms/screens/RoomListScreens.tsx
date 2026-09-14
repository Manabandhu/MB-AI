import { radius, space } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  deleteRoomListing,
  getFavorites,
  getMyListings,
  unsaveRoom,
  updateRoomListing,
} from '@/modules/rooms/api';
import type { OwnerRoomListing, RoomListing } from '@/modules/rooms/types';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

export function RoomFavoritesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [removedIds, setRemovedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.push('/rooms' as Href);
      return true;
    });
    return () => sub.remove();
  }, [router]);

  const { data } = useQuery({
    queryKey: ['rooms', 'favorites'],
    queryFn: getFavorites,
    retry: false,
  });

  const unsave = useMutation({
    mutationFn: (roomId: string) => unsaveRoom(roomId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', 'favorites'] }),
  });

  const allSaved = (data ?? []).filter((room) => !removedIds[room.id]);

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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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

      <FlatList
        data={allSaved}
        keyExtractor={(room) => room.id}
        renderItem={({ item: room }) => (
          <SavedRoomCard room={room} onUnsave={() => handleUnsave(room.id)} />
        )}
        contentContainerStyle={[styles.scrollContent, styles.listGrid]}
        ItemSeparatorComponent={() => <View style={{ height: space.x3 }} />}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={
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
        }
      />
    </SafeAreaView>
  );
}

function SavedRoomCard({ room, onUnsave }: { room: RoomListing; onUnsave: () => void }) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/rooms/${room.id}` as Href)} style={styles.savedCard}>
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

type ListingTab = 'ACTIVE' | 'DRAFT' | 'RENTED';

export function RoomMyListingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<ListingTab>('ACTIVE');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteModalListing, setDeleteModalListing] = useState<OwnerRoomListing | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.push('/rooms' as Href);
      return true;
    });
    return () => sub.remove();
  }, [router]);

  const { data } = useQuery({
    queryKey: ['rooms', 'my-listings'],
    queryFn: getMyListings,
    retry: false,
  });

  const listings = data ?? [];

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateRoomListing(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', 'my-listings'] });
      setActiveMenuId(null);
    },
  });

  const deleteListing = useMutation({
    mutationFn: (id: string) => deleteRoomListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', 'my-listings'] });
      setDeleteModalListing(null);
      setActiveMenuId(null);
    },
  });

  const activeListings = listings.filter((l) => l.status === 'ACTIVE' || l.status === 'PUBLISHED');
  const draftListings = listings.filter((l) => l.status === 'DRAFT' || l.status === 'PAUSED');
  const rentedListings = listings.filter((l) => l.status === 'RENTED' || l.status === 'ARCHIVED');

  const filteredListings =
    selectedTab === 'ACTIVE'
      ? activeListings
      : selectedTab === 'DRAFT'
        ? draftListings
        : rentedListings;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityLabel="Back to Rooms"
            onPress={() => router.push('/rooms' as Href)}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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

      {/* Tabs Filter Bar: Active, Draft, Rented */}
      <View style={styles.tabsContainer}>
        {(
          [
            { key: 'ACTIVE', label: 'Active', count: activeListings.length },
            { key: 'DRAFT', label: 'Draft', count: draftListings.length },
            { key: 'RENTED', label: 'Rented', count: rentedListings.length },
          ] as const
        ).map((tab) => {
          const isSelected = selectedTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setSelectedTab(tab.key)}
              style={[styles.tabButton, isSelected && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, isSelected && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isSelected && styles.tabBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filteredListings}
        keyExtractor={(listing) => listing.id}
        renderItem={({ item: listing }) => {
          const isRented = listing.status === 'RENTED' || listing.status === 'ARCHIVED';
          const isMenuOpen = activeMenuId === listing.id;

          return (
            <View
              key={listing.id}
              style={[styles.myListingCard, isRented && styles.myListingCardRented]}
            >
              <View style={styles.cardHeaderInfo}>
                <View style={styles.cardTypeRow}>
                  <View
                    style={[
                      styles.statusBadgeContainer,
                      isRented
                        ? styles.statusBadgeRented
                        : listing.status === 'ACTIVE'
                          ? styles.statusBadgeActive
                          : styles.statusBadgeDraft,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeLabel,
                        isRented
                          ? styles.statusBadgeLabelRented
                          : listing.status === 'ACTIVE'
                            ? styles.statusBadgeLabelActive
                            : styles.statusBadgeLabelDraft,
                      ]}
                    >
                      {listing.status}
                    </Text>
                  </View>

                  {/* Three-dot action menu toggle */}
                  <Pressable
                    accessibilityLabel="Listing options"
                    onPress={() => setActiveMenuId(isMenuOpen ? null : listing.id)}
                    style={styles.menuTriggerBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.menuTriggerDots}>⋮</Text>
                  </Pressable>
                </View>

                {/* Popover / expanded action menu */}
                {isMenuOpen && (
                  <View style={styles.menuPopover}>
                    <Pressable
                      onPress={() => {
                        setActiveMenuId(null);
                        router.push(`/rooms/${listing.id}/edit` as Href);
                      }}
                      style={styles.menuItem}
                    >
                      <Text style={styles.menuItemText}>✏️ Edit Listing</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        const newStatus = isRented ? 'ACTIVE' : 'RENTED';
                        updateStatus.mutate({ id: listing.id, status: newStatus });
                      }}
                      style={styles.menuItem}
                    >
                      <Text style={styles.menuItemText}>
                        {isRented ? '🔄 Mark as Active' : '🏷️ Mark as Rented'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setActiveMenuId(null);
                        setDeleteModalListing(listing);
                      }}
                      style={[styles.menuItem, styles.menuItemDestructive]}
                    >
                      <Text style={styles.menuItemDestructiveText}>🗑️ Delete Listing</Text>
                    </Pressable>
                  </View>
                )}

                <View style={styles.titlePriceRow}>
                  <Text style={styles.cardTitle}>{listing.title}</Text>
                  <Text style={styles.priceValue}>${listing.price}/mo</Text>
                </View>

                <Text style={styles.locationText}>{listing.broadLocation}</Text>
              </View>

              <View style={styles.actionButtonGroup}>
                <Pressable
                  onPress={() => router.push(`/rooms/${listing.id}/edit` as Href)}
                  style={styles.cardActionBtn}
                >
                  <Text style={styles.cardActionBtnText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const newStatus = isRented ? 'ACTIVE' : 'RENTED';
                    updateStatus.mutate({ id: listing.id, status: newStatus });
                  }}
                  style={[styles.cardActionBtn, isRented && styles.cardActionBtnAccent]}
                >
                  <Text
                    style={[styles.cardActionBtnText, isRented && styles.cardActionBtnTextAccent]}
                  >
                    {isRented ? 'Mark Active' : 'Mark Rented'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setDeleteModalListing(listing)}
                  style={[styles.cardActionBtn, styles.cardActionBtnDanger]}
                >
                  <Text style={styles.cardActionBtnDangerText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        contentContainerStyle={[styles.scrollContent, styles.listGrid]}
        ItemSeparatorComponent={() => <View style={{ height: space.x3 }} />}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏡</Text>
            <Text style={styles.emptyTitle}>
              {selectedTab === 'ACTIVE'
                ? 'No active listings'
                : selectedTab === 'DRAFT'
                  ? 'No draft listings'
                  : 'No rented listings'}
            </Text>
            <Text style={styles.emptyBody}>
              {selectedTab === 'ACTIVE'
                ? 'Ready to host? Post a room listing to connect with diaspora housemates.'
                : selectedTab === 'DRAFT'
                  ? 'Draft listings in progress will appear here.'
                  : 'Listings marked as rented will appear here for your records.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/rooms/create-listing' as Href)}
              style={styles.exploreBtn}
            >
              <Text style={styles.exploreBtnText}>Post a Room Listing</Text>
            </Pressable>
          </View>
        }
      />

      {/* Confirmation Modal for Delete */}
      <Modal
        animationType="fade"
        transparent
        visible={Boolean(deleteModalListing)}
        onRequestClose={() => setDeleteModalListing(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Text style={styles.modalIconEmoji}>⚠️</Text>
            </View>
            <Text style={styles.modalTitle}>Delete Room Listing?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to permanently delete &ldquo;
              {deleteModalListing?.title}&rdquo;? All inquiries and data associated with this
              listing will be permanently removed.
            </Text>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setDeleteModalListing(null)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (deleteModalListing) {
                    deleteListing.mutate(deleteModalListing.id);
                  }
                }}
                style={styles.modalDeleteBtn}
              >
                <Text style={styles.modalDeleteText}>
                  {deleteListing.isPending ? 'Deleting...' : 'Delete Listing'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaedff',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: '#f2f3ff',
  },
  tabButtonActive: {
    backgroundColor: '#431ebe',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#55596e',
  },
  tabButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#55596e',
  },
  tabBadgeTextActive: {
    color: '#fff',
  },
  myListingCardRented: {
    opacity: 0.85,
    borderColor: '#e0e2ec',
    backgroundColor: '#fafafc',
  },
  statusBadgeContainer: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(0,105,107,0.1)',
  },
  statusBadgeDraft: {
    backgroundColor: 'rgba(67,30,190,0.1)',
  },
  statusBadgeRented: {
    backgroundColor: '#e2e3e9',
  },
  statusBadgeLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadgeLabelActive: {
    color: '#00696b',
  },
  statusBadgeLabelDraft: {
    color: '#431ebe',
  },
  statusBadgeLabelRented: {
    color: '#545869',
  },
  menuTriggerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f3ff',
  },
  menuTriggerDots: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1c28',
    marginTop: -4,
  },
  menuPopover: {
    position: 'absolute',
    top: 36,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eaedff',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    width: 170,
  },
  menuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1c28',
  },
  menuItemDestructive: {
    borderTopWidth: 1,
    borderTopColor: '#f2f3ff',
    marginTop: 4,
  },
  menuItemDestructiveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ba1a1a',
  },
  titlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.x2,
    marginTop: 4,
  },
  cardActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#f2f3ff',
  },
  cardActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#431ebe',
  },
  cardActionBtnAccent: {
    backgroundColor: 'rgba(0,105,107,0.08)',
  },
  cardActionBtnTextAccent: {
    color: '#00696b',
  },
  cardActionBtnDanger: {
    backgroundColor: '#ffedee',
  },
  cardActionBtnDangerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.x4,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: space.x5,
    width: '100%',
    maxWidth: 400,
    gap: space.x3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffedee',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  modalIconEmoji: {
    fontSize: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1c28',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    color: '#55596e',
    textAlign: 'center',
    lineHeight: 19,
  },
  modalActions: {
    flexDirection: 'row',
    gap: space.x3,
    marginTop: space.x2,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: '#f2f3ff',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#55596e',
  },
  modalDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
