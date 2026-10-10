import { space } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
  getMyListings,
  pauseRoomListing,
  publishRoomListing,
  updateRoomListing,
} from '@/modules/rooms/api';
import type { OwnerRoomListing } from '@/modules/rooms/types';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

import { styles } from './roomListStyles';

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

  const { data, refetch } = useQuery({
    queryKey: ['rooms', 'my-listings'],
    queryFn: getMyListings,
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

  const listings = data ?? [];

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateRoomListing(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', 'my-listings'] });
      setActiveMenuId(null);
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      if (currentStatus === 'ACTIVE' || currentStatus === 'PUBLISHED') {
        return pauseRoomListing(id);
      } else {
        return publishRoomListing(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', 'my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', 'listings'] });
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

              {/* 1-Tap Active / Deactivate Toggle Row */}
              <View style={styles.statusToggleRow}>
                <View style={styles.statusPillWrap}>
                  <View
                    style={[
                      styles.statusDot,
                      listing.status === 'ACTIVE' || listing.status === 'PUBLISHED'
                        ? styles.statusDotActive
                        : styles.statusDotPaused,
                    ]}
                  />
                  <Text style={styles.statusPillText}>
                    {listing.status === 'ACTIVE' || listing.status === 'PUBLISHED'
                      ? '🟢 Visible in search'
                      : '⏸️ Deactivated'}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={
                    listing.status === 'ACTIVE' || listing.status === 'PUBLISHED'
                      ? 'Deactivate listing'
                      : 'Activate listing'
                  }
                  accessibilityRole="button"
                  disabled={toggleStatus.isPending}
                  onPress={() =>
                    toggleStatus.mutate({
                      id: listing.id,
                      currentStatus: listing.status,
                    })
                  }
                  style={[
                    styles.toggleStatusBtn,
                    listing.status === 'ACTIVE' || listing.status === 'PUBLISHED'
                      ? styles.toggleStatusBtnDeactivate
                      : styles.toggleStatusBtnActivate,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleStatusBtnText,
                      listing.status === 'ACTIVE' || listing.status === 'PUBLISHED'
                        ? styles.toggleStatusBtnTextDeactivate
                        : styles.toggleStatusBtnTextActivate,
                    ]}
                  >
                    {listing.status === 'ACTIVE' || listing.status === 'PUBLISHED'
                      ? '⏸️ Deactivate'
                      : '🟢 Activate'}
                  </Text>
                </Pressable>
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
        refreshing={isRefreshing}
        onRefresh={onRefresh}
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
