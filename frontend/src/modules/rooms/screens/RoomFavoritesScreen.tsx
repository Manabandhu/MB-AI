import { space } from '@manabandhu/design-system';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFavorites } from '@/modules/rooms/api';
import { useSavedRoomsStore } from '@/modules/rooms/savedRoomsStore';
import type { RoomListing } from '@/modules/rooms/types';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

import { styles } from './roomListStyles';

export function RoomFavoritesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [removedIds, setRemovedIds] = useState<Record<string, boolean>>({});

  const savedRoomsMap = useSavedRoomsStore((s) => s.savedRooms);
  const removeSaved = useSavedRoomsStore((s) => s.removeSaved);
  const setFavoritesFromBackend = useSavedRoomsStore((s) => s.setFavoritesFromBackend);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.push('/rooms' as Href);
      return true;
    });
    return () => sub.remove();
  }, [router]);

  const { data: backendFavorites, refetch } = useQuery({
    queryKey: ['rooms', 'favorites'],
    queryFn: getFavorites,
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

  useEffect(() => {
    if (backendFavorites && backendFavorites.length > 0) {
      setFavoritesFromBackend(backendFavorites);
    }
  }, [backendFavorites, setFavoritesFromBackend]);

  const allSaved = useMemo(() => {
    const map = new Map<string, RoomListing>();
    for (const r of Object.values(savedRoomsMap)) {
      map.set(r.id, r);
    }
    for (const r of backendFavorites ?? []) {
      map.set(r.id, r);
    }
    return Array.from(map.values()).filter((room) => !removedIds[room.id]);
  }, [savedRoomsMap, backendFavorites, removedIds]);

  const handleUnsave = (id: string) => {
    setRemovedIds((prev) => ({ ...prev, [id]: true }));
    removeSaved(id);
    queryClient.invalidateQueries({ queryKey: ['rooms', 'favorites'] });
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
          {room.isVerifiedHost ? <View style={styles.verifiedDot} /> : null}
          <Text style={styles.hostTrustText}>
            {room.isVerifiedHost ? 'Verified Host' : 'Community Host'}
          </Text>
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
