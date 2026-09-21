import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RoomListing } from '@/modules/rooms/types';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

export interface RoomMapCarouselProps {
  listings: RoomListing[];
  selectedListingId: string | null;
  onSelectListing: (listing: RoomListing) => void;
  onListingSnap?: (listing: RoomListing) => void;
  style?: object;
}

const DEFAULT_THUMBNAILS = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
];

export function RoomMapCarousel({
  listings,
  selectedListingId,
  onSelectListing,
  onListingSnap,
  style,
}: RoomMapCarouselProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList<RoomListing>>(null);
  const isUserScrolling = useRef(false);

  const cardWidth = Math.min(width * 0.82, 330);
  const cardGap = 12;
  const snapInterval = cardWidth + cardGap;
  const sideInset = (width - cardWidth) / 2;

  // Scroll to selected listing when selected from pin
  useEffect(() => {
    if (!selectedListingId || listings.length === 0 || isUserScrolling.current) return;
    const index = listings.findIndex((item) => item.id === selectedListingId);
    if (index >= 0) {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [selectedListingId, listings]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].item) {
        const activeItem = viewableItems[0].item as RoomListing;
        if (onListingSnap && isUserScrolling.current) {
          onListingSnap(activeItem);
        }
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const renderCard = useCallback(
    ({ item, index }: { item: RoomListing; index: number }) => {
      const isSelected = selectedListingId === item.id;
      const imageUrl = DEFAULT_THUMBNAILS[index % DEFAULT_THUMBNAILS.length];
      const isVeg = item.dietaryPreference === 'PURE_VEG';
      const isPrivateBath = item.bathroomType === 'PRIVATE_ATTACHED';

      return (
        <Pressable
          onPress={() => {
            onSelectListing(item);
            onListingSnap?.(item);
          }}
          accessibilityLabel={`${item.title}, $${item.price} per month`}
          style={[styles.card, { width: cardWidth }, isSelected && styles.cardSelected]}
        >
          {/* Card Top: Image & Badges */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />

            {/* Price Pill Floating */}
            <View style={styles.pricePill}>
              <Text style={styles.priceText}>${item.price}</Text>
              <Text style={styles.pricePeriod}>/mo</Text>
            </View>

            {/* Room Type Pill */}
            <View style={styles.roomTypePill}>
              <Text style={styles.roomTypeText} numberOfLines={1}>
                {item.roomType || 'Private Room'}
              </Text>
            </View>
          </View>

          {/* Card Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {item.title}
            </Text>

            <View style={styles.locationRow}>
              <AppIcon name="map" size={13} color="#431ebe" />
              <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                {item.broadLocation || 'Dallas-Fort Worth, TX'}
              </Text>
            </View>

            {/* Cultural & Lifestyle Tags */}
            <View style={styles.tagsRow}>
              {isVeg && (
                <View style={[styles.tagPill, styles.vegTag]}>
                  <Text style={styles.vegTagText}>🥦 Pure Veg</Text>
                </View>
              )}
              {isPrivateBath && (
                <View style={[styles.tagPill, styles.bathTag]}>
                  <Text style={styles.bathTagText}>🚿 Private Bath</Text>
                </View>
              )}
              {item.utilitiesIncluded && (
                <View style={[styles.tagPill, styles.utilTag]}>
                  <Text style={styles.utilTagText}>⚡ Utilities Inc.</Text>
                </View>
              )}
              {item.isVerifiedHost && (
                <View style={[styles.tagPill, styles.verifiedTag]}>
                  <Text style={styles.verifiedTagText}>✓ Verified</Text>
                </View>
              )}
            </View>

            {/* Action Bar */}
            <View style={styles.cardActions}>
              <Pressable
                onPress={() => router.push(`/rooms/${item.id}` as Href)}
                style={styles.detailsBtn}
                accessibilityRole="button"
                accessibilityLabel="View details"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.detailsBtnText}>View Details</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push(`/rooms/${item.id}/inquiry` as Href)}
                style={styles.chatBtn}
                accessibilityRole="button"
                accessibilityLabel="Contact host"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppIcon name="message" size={13} color="#ffffff" />
                <Text style={styles.chatBtnText}>Chat</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      );
    },
    [cardWidth, onListingSnap, onSelectListing, router, selectedListingId],
  );

  if (listings.length === 0) return null;

  return (
    <View
      style={[styles.carouselWrapper, { paddingBottom: Math.max(insets.bottom, 16) + 4 }, style]}
    >
      <FlatList
        ref={flatListRef}
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: sideInset,
          gap: cardGap,
        }}
        onScrollBeginDrag={() => {
          isUserScrolling.current = true;
        }}
        onScrollEndDrag={() => {
          setTimeout(() => {
            isUserScrolling.current = false;
          }, 300);
        }}
        onMomentumScrollEnd={() => {
          isUserScrolling.current = false;
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: snapInterval,
          offset: snapInterval * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  carouselWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      default: {
        boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
      },
    }),
  },
  cardSelected: {
    borderColor: '#431ebe',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#431ebe',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      default: {
        boxShadow: '0 8px 24px rgba(67,30,190,0.22)',
      },
    }),
  },
  imageContainer: {
    height: 110,
    width: '100%',
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pricePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(19, 27, 46, 0.88)',
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  priceText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  pricePeriod: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
  },
  roomTypePill: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roomTypeText: {
    color: '#431ebe',
    fontSize: 11,
    fontWeight: '700',
  },
  contentContainer: {
    padding: 10,
  },
  title: {
    color: '#131b2e',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    color: '#625f6e',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 4,
    marginTop: 6,
    overflow: 'hidden',
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vegTag: {
    backgroundColor: '#e8f5e9',
  },
  vegTagText: {
    color: '#2e7d32',
    fontSize: 10,
    fontWeight: '700',
  },
  bathTag: {
    backgroundColor: '#e0f2fe',
  },
  bathTagText: {
    color: '#0284c7',
    fontSize: 10,
    fontWeight: '700',
  },
  utilTag: {
    backgroundColor: '#fef3c7',
  },
  utilTagText: {
    color: '#b45309',
    fontSize: 10,
    fontWeight: '700',
  },
  verifiedTag: {
    backgroundColor: '#f0fdf4',
  },
  verifiedTagText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  detailsBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtnText: {
    color: '#131b2e',
    fontSize: 11,
    fontWeight: '700',
  },
  chatBtn: {
    flex: 1,
    backgroundColor: '#431ebe',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chatBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
