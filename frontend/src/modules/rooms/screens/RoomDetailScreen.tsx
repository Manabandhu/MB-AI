import { color as baseColors, radius, space } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/authStore';
import { getRoomDetail, inquireRoom, saveRoom, unsaveRoom } from '@/modules/rooms/api';
import { useSavedRoomsStore } from '@/modules/rooms/savedRoomsStore';
import type { RoomListing } from '@/modules/rooms/types';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
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

type GalleryPhoto = {
  url: string;
  label: string;
  tag: string;
};

const DEFAULT_ROOM_PHOTOS: GalleryPhoto[] = [
  {
    url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
    label: 'Master Bedroom with Ample Natural Light',
    tag: 'Master Bed',
  },
  {
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    label: 'Attached Private Bath & Modern Vanity',
    tag: 'Private Bath',
  },
  {
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    label: 'Modular Kitchen with Modern Appliances',
    tag: 'Kitchen',
  },
  {
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    label: 'Shared Living Hall & Dining Space',
    tag: 'Living Area',
  },
  {
    url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80',
    label: 'Community Pool & Recreation Club',
    tag: 'Amenities',
  },
];

export function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const queryClient = useQueryClient();
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = status === 'authenticated';
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const insets = useSafeAreaInsets();

  const carouselScrollRef = useRef<ScrollView>(null);
  const [carouselWidth, setCarouselWidth] = useState(width - 32);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => sub.remove();
  }, []);

  const [isSavedLocal, setIsSavedLocal] = useState<boolean | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const galleryPhotos: GalleryPhoto[] = useMemo(() => {
    return DEFAULT_ROOM_PHOTOS;
  }, []);

  const scrollToPhoto = (index: number) => {
    const nextIdx = Math.max(0, Math.min(galleryPhotos.length - 1, index));
    setActivePhotoIndex(nextIdx);
    carouselScrollRef.current?.scrollTo({ x: nextIdx * carouselWidth, animated: true });
  };

  const [chatStarting, setChatStarting] = useState(false);

  const { data: apiRoom, isLoading } = useQuery({
    queryKey: ['rooms', 'detail', roomId],
    queryFn: () => getRoomDetail(roomId),
    enabled: Boolean(roomId),
    retry: false,
  });

  const isRoomSavedInStore = useSavedRoomsStore((s) => Boolean(s.savedRooms[roomId]));
  const toggleSaveInStore = useSavedRoomsStore((s) => s.toggleSave);

  const isSaved =
    isSavedLocal !== null ? isSavedLocal : isRoomSavedInStore || Boolean(apiRoom?.savedByViewer);

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (apiRoom) {
        const next = await toggleSaveInStore(apiRoom);
        setIsSavedLocal(next);
      } else {
        if (isSaved) {
          await unsaveRoom(roomId);
          setIsSavedLocal(false);
        } else {
          await saveRoom(roomId);
          setIsSavedLocal(true);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', 'detail', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', 'favorites'] });
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <LoadingState label="Loading room details..." />
      </SafeAreaView>
    );
  }

  if (!apiRoom) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={[s.navBar, isDesktop && s.navBarDesktop]}>
          <Pressable onPress={() => router.back()} style={s.navBtn} accessibilityLabel="Back">
            <AppIcon color={colors.ink} name="chevron-left" size={20} />
          </Pressable>
          <Text style={s.navTitle} numberOfLines={1}>
            Room Details
          </Text>
        </View>
        <ErrorState
          title="Room not found"
          body="The room listing you are looking for does not exist or has been removed."
          retryLabel="Browse Rooms"
          onRetry={() => router.push('/rooms' as Href)}
        />
      </SafeAreaView>
    );
  }

  const room: RoomListing = apiRoom;

  const handleSaveToggle = () => {
    if (!isAuthenticated) {
      router.push('/sign-in' as Href);
      return;
    }
    toggleSaveMutation.mutate();
  };

  const handleChatWithLandlord = async () => {
    if (!isAuthenticated) {
      router.push('/sign-in' as Href);
      return;
    }
    if (!room || !roomId) return;
    try {
      setChatStarting(true);
      const res = await inquireRoom(roomId, {
        moveInDate: new Date().toISOString().split('T')[0],
        stayDurationMonths: 6,
        dietaryLifestyle: room.dietaryPreference || 'Flexible',
        introMessage: `Hello, I'm interested in your room listing "${room.title}" ($${room.price}/mo). Is it currently available for move-in?`,
      });
      if (res?.conversationId) {
        router.push(`/chat/${res.conversationId}` as Href);
      } else {
        router.push(`/rooms/${roomId}/inquiry` as Href);
      }
    } catch {
      router.push(`/rooms/${roomId}/inquiry` as Href);
    } finally {
      setChatStarting(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: room.title,
        message: `Check out this housing on ManaBandhu: ${room.title} ($${room.price}/mo)\nmanabandhu://rooms/${roomId}`,
        url: `manabandhu://rooms/${roomId}`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const samplePhotos = [
    '🛏️ Master Bed',
    '🚿 Attached Bath',
    '🍳 Modular Kitchen',
    '🏊 Community Pool',
  ];

  const dietaryLabel =
    room.dietaryPreference === 'PURE_VEG'
      ? '🥦 Pure Veg Only'
      : room.dietaryPreference === 'VEG_FRIENDLY'
        ? '🍳 Veg Friendly'
        : room.dietaryPreference === 'NON_VEG_ALLOWED'
          ? '🍗 Non-Veg OK'
          : '🌱 Any Diet';

  const genderLabel =
    room.genderPreference === 'FEMALE_ONLY'
      ? '👩 Female Only'
      : room.genderPreference === 'MALE_ONLY'
        ? '👨 Male Only'
        : '👥 Any Gender';

  const bathLabel =
    room.bathroomType === 'PRIVATE_ATTACHED'
      ? '🚿 Private Attached'
      : room.bathroomType === 'PRIVATE_DEDICATED'
        ? '🛁 Dedicated Bath'
        : '🚪 Shared Bath';

  return (
    <SafeAreaView style={s.safeArea}>
      {/* ─── Top Bar ───────────────────────────────────────────────────────────── */}
      <View
        style={[
          s.navBar,
          isDesktop && s.navBarDesktop,
          { paddingTop: Math.max(insets.top > 0 ? 8 : space.x3, space.x3) },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={s.navBtn}
          accessibilityLabel="Back"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon color={colors.ink} name="chevron-left" size={20} />
        </Pressable>
        <Text style={s.navTitle} numberOfLines={1}>
          Room Details
        </Text>
        <View style={s.navActions}>
          <Pressable
            onPress={handleSaveToggle}
            style={s.navBtn}
            accessibilityLabel="Save Room"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppIcon color={isSaved ? '#ba1a1a' : colors.muted} name="star" size={18} />
          </Pressable>
          <Pressable
            onPress={handleShare}
            style={s.navBtn}
            accessibilityLabel="Share"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppIcon color={colors.ink} name="globe" size={18} />
          </Pressable>
        </View>
      </View>

      {/* ─── Main Content ──────────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[
          s.content,
          isDesktop && s.contentDesktop,
          { paddingBottom: Math.max(insets.bottom, 16) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Gallery Carousel */}
        <View
          style={s.galleryContainer}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) setCarouselWidth(w);
          }}
        >
          {/* Horizontal Scrollable Carousel */}
          <ScrollView
            ref={carouselScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const idx = Math.round(offsetX / (carouselWidth || 1));
              setActivePhotoIndex(idx);
            }}
            style={{ width: carouselWidth }}
          >
            {galleryPhotos.map((photo) => (
              <View key={photo.url} style={[s.gallerySlide, { width: carouselWidth }]}>
                <Image
                  source={{ uri: photo.url }}
                  style={[s.slideImage, { width: carouselWidth }]}
                  resizeMode="cover"
                />
                <View style={s.slideGradientOverlay}>
                  <Text style={s.galleryCaption} numberOfLines={1}>
                    {photo.label}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Floating Category Tag */}
          <View style={s.photoCategoryPill}>
            <Text style={s.photoCategoryText}>
              {galleryPhotos[activePhotoIndex]?.tag ?? 'Room Photo'}
            </Text>
          </View>

          {/* Floating Slide Counter */}
          <View style={s.photoCounterPill}>
            <Text style={s.photoCounterText}>
              {activePhotoIndex + 1} / {galleryPhotos.length}
            </Text>
          </View>

          {/* Previous / Next Chevron Buttons */}
          {activePhotoIndex > 0 && (
            <Pressable
              accessibilityLabel="Previous image"
              accessibilityRole="button"
              onPress={() => scrollToPhoto(activePhotoIndex - 1)}
              style={[s.carouselNavBtn, s.carouselNavBtnLeft]}
            >
              <Text style={s.carouselNavBtnText}>‹</Text>
            </Pressable>
          )}

          {activePhotoIndex < galleryPhotos.length - 1 && (
            <Pressable
              accessibilityLabel="Next image"
              accessibilityRole="button"
              onPress={() => scrollToPhoto(activePhotoIndex + 1)}
              style={[s.carouselNavBtn, s.carouselNavBtnRight]}
            >
              <Text style={s.carouselNavBtnText}>›</Text>
            </Pressable>
          )}

          {/* Pagination Dots */}
          <View style={s.dotsRow}>
            {galleryPhotos.map((photo, i) => (
              <Pressable
                key={photo.url}
                onPress={() => scrollToPhoto(i)}
                style={[s.dot, activePhotoIndex === i && s.dotActive]}
              />
            ))}
          </View>

          {/* Thumbnail Gallery Strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.photoThumbnailRow}
          >
            {galleryPhotos.map((photo, i) => (
              <Pressable
                key={photo.url}
                onPress={() => scrollToPhoto(i)}
                style={[s.photoThumbItem, activePhotoIndex === i && s.photoThumbItemActive]}
                accessibilityRole="button"
                accessibilityLabel={`View ${photo.tag}`}
              >
                <Image source={{ uri: photo.url }} style={s.photoThumbImage} resizeMode="cover" />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Title, Badges & Zero-Brokerage Banner */}
        <View style={s.mainHeaderSection}>
          <View style={s.typeTagRow}>
            <View style={s.roomTypeTag}>
              <Text style={s.roomTypeTagText}>{room.roomType}</Text>
            </View>
            <View style={s.dietTag}>
              <Text style={s.dietTagText}>{dietaryLabel}</Text>
            </View>
            <View style={s.zeroBrokerageTag}>
              <AppIcon color={colors.teal} name="shield" size={12} />
              <Text style={s.zeroBrokerageTagText}>Direct Owner • Zero Brokerage</Text>
            </View>
          </View>

          <Text style={s.roomTitle}>{room.title}</Text>

          <View style={s.locationMetaRow}>
            <AppIcon color={colors.appPrimary} name="map" size={15} />
            <Text style={s.locationMetaText}>{room.broadLocation}</Text>
          </View>

          {/* Pricing Breakdown Card (Rent + Utilities + Deposit) */}
          <View style={s.pricingCard}>
            <View style={s.priceBreakdownRow}>
              <View style={s.priceCol}>
                <Text style={s.priceColLabel}>Base Rent</Text>
                <Text style={s.priceColVal}>
                  ${room.price}
                  <Text style={s.priceColPeriod}>/mo</Text>
                </Text>
              </View>
              <View style={s.priceDivider} />
              <View style={s.priceCol}>
                <Text style={s.priceColLabel}>Utilities</Text>
                <Text style={s.priceColVal}>
                  {room.utilitiesIncluded ? 'Included' : `+$${room.estUtilityMonthly ?? 60}/mo`}
                </Text>
              </View>
              <View style={s.priceDivider} />
              <View style={s.priceCol}>
                <Text style={s.priceColLabel}>Deposit</Text>
                <Text style={s.priceColVal}>
                  {room.securityDeposit ? `$${room.securityDeposit}` : '$0'}
                </Text>
              </View>
            </View>
            <View style={s.priceTagBottom}>
              <Text style={s.utilitiesText}>
                {room.utilitiesIncluded
                  ? '⚡ High-speed WiFi, electricity, water & trash included in rent'
                  : '⚡ Electricity, water & internet split equally among flatmates'}
              </Text>
            </View>
          </View>
        </View>

        {/* Verified Host Profile Card */}
        <View style={s.hostCard}>
          <View style={s.hostCardTop}>
            <View style={s.hostCardAvatar}>
              <AppIcon color={colors.appPrimary} name="user" size={20} />
            </View>
            <View style={s.hostCardInfo}>
              <View style={s.hostNameRow}>
                <Text style={s.hostNameText}>Verified Resident Host</Text>
                <View style={s.verifiedHostPill}>
                  <AppIcon color={colors.teal} name="check" size={10} strokeWidth={3} />
                  <Text style={s.verifiedHostPillText}>Verified Host</Text>
                </View>
              </View>
              <Text style={s.hostWorkText}>Direct Community Member • ManaBandhu Network</Text>
              <Text style={s.hostReplyText}>
                ⚡ Instant Chat handshake upon inquiry • Zero Brokerage
              </Text>
            </View>
          </View>
        </View>

        {/* Desi Flatmate Compatibility Badges */}
        <View style={s.sectionBlock}>
          <Text style={s.sectionHeading}>Flatmate Compatibility & Preferences</Text>
          <View style={s.compatBadgesRow}>
            <View style={s.compatBadge}>
              <Text style={s.compatBadgeLabel}>Kitchen</Text>
              <Text style={s.compatBadgeVal}>{dietaryLabel}</Text>
            </View>
            <View style={s.compatBadge}>
              <Text style={s.compatBadgeLabel}>Flatmates</Text>
              <Text style={s.compatBadgeVal}>{genderLabel}</Text>
            </View>
            <View style={s.compatBadge}>
              <Text style={s.compatBadgeLabel}>Bathroom</Text>
              <Text style={s.compatBadgeVal}>{bathLabel}</Text>
            </View>
            <View style={s.compatBadge}>
              <Text style={s.compatBadgeLabel}>Lease</Text>
              <Text style={s.compatBadgeVal}>{room.leaseTerm || 'Flexible'}</Text>
            </View>
          </View>
        </View>

        {/* Room & Apartment Amenities */}
        <View style={s.sectionBlock}>
          <Text style={s.sectionHeading}>Included Amenities</Text>
          <View style={s.amenitiesGrid}>
            {(room.amenities ?? []).length > 0 ? (
              room.amenities.map((amenity) => (
                <View key={amenity} style={s.amenityItem}>
                  <View style={s.amenityCheckCircle}>
                    <AppIcon color={colors.teal} name="check" size={12} strokeWidth={3} />
                  </View>
                  <Text style={s.amenityLabel}>{amenity}</Text>
                </View>
              ))
            ) : (
              <Text style={s.descriptionText}>
                High-speed WiFi, In-unit Laundry, Kitchen Access
              </Text>
            )}
          </View>
        </View>

        {/* Commute & Indian Groceries Notes */}
        <View style={s.sectionBlock}>
          <Text style={s.sectionHeading}>Commute & Neighborhood</Text>
          <View style={s.commuteRow}>
            <AppIcon color={colors.appPrimary} name="map" size={16} />
            <Text style={s.commuteText}>
              {room.universityShuttleAccessible
                ? '🚌 Walkable to University shuttle route and tech transit hubs'
                : '📍 Convenient access to major highway tech corridors'}
            </Text>
          </View>
          <View style={s.commuteRow}>
            <AppIcon color={colors.teal} name="check" size={16} />
            <Text style={s.commuteText}>
              🛒 Close to Indian grocery stores (Patel Brothers, India Bazaar, Desi restaurants)
            </Text>
          </View>
        </View>

        {/* Description Section */}
        {room.description ? (
          <View style={s.sectionBlock}>
            <Text style={s.sectionHeading}>About this Home</Text>
            <Text style={s.descriptionText}>{room.description}</Text>
          </View>
        ) : null}

        {/* Privacy & Location Notice */}
        <View style={s.privacyNoticeCard}>
          <AppIcon color={colors.appPrimary} name="shield" size={20} />
          <View style={s.privacyNoticeContent}>
            <Text style={s.privacyNoticeTitle}>Location Privacy Protected</Text>
            <Text style={s.privacyNoticeBody}>
              Approximate neighborhood shown for member safety. The exact street address and unit
              number are shared automatically once your inquiry is accepted by the host.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ─── Sticky Bottom Bar (1-Click Real-Time Chat Handshake) ─────────────── */}
      <View
        style={[
          s.bottomBar,
          isDesktop && s.bottomBarDesktop,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={s.bottomPriceCol}>
          <View style={s.priceRow}>
            <Text style={s.bottomPriceVal}>${room.price}</Text>
            <Text style={s.bottomPricePeriod}>/mo</Text>
          </View>
          <Text style={s.bottomDeposit}>
            {room.utilitiesIncluded ? 'Utilities Included' : 'Low Deposit'}
          </Text>
        </View>

        <View style={s.bottomActions}>
          <Pressable
            style={StyleSheet.flatten(s.inquireCtaBtn)}
            accessibilityLabel="Chat with Landlord"
            accessibilityRole="button"
            disabled={chatStarting}
            onPress={handleChatWithLandlord}
          >
            {chatStarting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <AppIcon color="#fff" name="message" size={16} />
                <Text style={s.inquireCtaBtnText}>Chat with Landlord</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(250,248,255,0.98)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: space.x4,
    height: 56,
  },
  navBarDesktop: {
    paddingHorizontal: space.x8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: space.x2,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
  },
  content: {
    padding: space.x4,
    gap: space.x4,
    paddingBottom: 120,
  },
  contentDesktop: {
    paddingHorizontal: space.x8,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  galleryContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#eaedff',
  },
  gallerySlide: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  slideImage: {
    height: 240,
    width: '100%',
  },
  slideGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  galleryCaption: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  photoCategoryPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(67,30,190,0.85)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  photoCategoryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  photoCounterPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  photoCounterText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  carouselNavBtn: {
    position: 'absolute',
    top: 95,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  carouselNavBtnLeft: {
    left: 10,
  },
  carouselNavBtnRight: {
    right: 10,
  },
  carouselNavBtnText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: -2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.appPrimary,
  },
  photoThumbnailRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f9',
    justifyContent: 'center',
  },
  photoThumbItem: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  photoThumbItemActive: {
    borderColor: colors.appPrimary,
  },
  photoThumbImage: {
    width: '100%',
    height: '100%',
  },
  mainHeaderSection: {
    gap: space.x2,
  },
  typeTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  roomTypeTag: {
    backgroundColor: colors.indigoSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roomTypeTagText: {
    color: colors.appPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  dietTag: {
    backgroundColor: colors.tealSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dietTagText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '800',
  },
  zeroBrokerageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tealSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  zeroBrokerageTagText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: '800',
  },
  roomTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
  },
  locationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationMetaText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  pricingCard: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(67,30,190,0.18)',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: space.x4,
    gap: 12,
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  priceCol: {
    alignItems: 'center',
    gap: 2,
  },
  priceColLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  priceColVal: {
    color: colors.appPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  priceColPeriod: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
  },
  priceDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  priceTagBottom: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  utilitiesText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  hostCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: space.x4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hostCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hostCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostCardInfo: {
    flex: 1,
    gap: 2,
  },
  hostNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostNameText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  verifiedHostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.tealSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  verifiedHostPillText: {
    color: colors.teal,
    fontSize: 10,
    fontWeight: '800',
  },
  hostWorkText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  hostReplyText: {
    color: colors.appPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeading: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  compatBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compatBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
    minWidth: 100,
  },
  compatBadgeLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  compatBadgeVal: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '46%',
  },
  amenityCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  commuteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commuteText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  descriptionText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 22,
  },
  privacyNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.x3,
    backgroundColor: colors.surfaceContainerLow,
    borderColor: 'rgba(67,30,190,0.15)',
    borderWidth: 1,
    borderRadius: 18,
    padding: space.x4,
  },
  privacyNoticeContent: {
    flex: 1,
    gap: 4,
  },
  privacyNoticeTitle: {
    color: colors.appPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  privacyNoticeBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomBarDesktop: {
    paddingHorizontal: space.x8,
  },
  bottomPriceCol: {
    gap: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  bottomPriceVal: {
    color: colors.appPrimary,
    fontSize: 22,
    fontWeight: '900',
  },
  bottomPricePeriod: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  bottomDeposit: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
  },
  inquireCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.appPrimary,
    borderRadius: radius.pill,
    paddingHorizontal: space.x5,
    paddingVertical: 12,
  },
  inquireCtaBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
