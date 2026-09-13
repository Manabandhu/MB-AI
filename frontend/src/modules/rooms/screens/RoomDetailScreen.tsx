import { color as baseColors, radius, space } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/authStore';
import { getRoomDetail, saveRoom, unsaveRoom } from '@/modules/rooms/api';
import type { RoomListing } from '@/modules/rooms/types';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ErrorState } from '@/modules/shared/components/ErrorState';

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

export function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const queryClient = useQueryClient();
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = status === 'authenticated';
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isSavedLocal, setIsSavedLocal] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const { data: apiRoom, isLoading } = useQuery({
    queryKey: ['rooms', 'detail', roomId],
    queryFn: () => getRoomDetail(roomId),
    enabled: Boolean(roomId),
    retry: false,
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
          <Text style={s.navTitle} numberOfLines={1}>Room Details</Text>
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
  const isSaved = isSavedLocal || room.savedByViewer;

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await unsaveRoom(roomId);
        setIsSavedLocal(false);
      } else {
        await saveRoom(roomId);
        setIsSavedLocal(true);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', 'detail', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', 'favorites'] });
    },
  });

  const handleSaveToggle = () => {
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }
    toggleSaveMutation.mutate();
  };

  const samplePhotos = ['🛏️ Master Bed', '🚿 Attached Bath', '🍳 Modular Kitchen', '🏊 Community Pool'];

  return (
    <SafeAreaView style={s.safeArea}>
      {/* ─── Top Bar ───────────────────────────────────────────────────────────── */}
      <View style={[s.navBar, isDesktop && s.navBarDesktop]}>
        <Pressable onPress={() => router.back()} style={s.navBtn} accessibilityLabel="Back">
          <AppIcon color={colors.ink} name="chevron-left" size={20} />
        </Pressable>
        <Text style={s.navTitle} numberOfLines={1}>Room Details</Text>
        <View style={s.navActions}>
          <Pressable onPress={handleSaveToggle} style={s.navBtn} accessibilityLabel="Save Room">
            <AppIcon color={isSaved ? '#ba1a1a' : colors.muted} name="star" size={18} />
          </Pressable>
          <Pressable onPress={() => router.push('/rooms/search')} style={s.navBtn} accessibilityLabel="Share">
            <AppIcon color={colors.ink} name="globe" size={18} />
          </Pressable>
        </View>
      </View>

      {/* ─── Main Content ──────────────────────────────────────────────────────── */}
      <ScrollView contentContainerStyle={[s.content, isDesktop && s.contentDesktop]} showsVerticalScrollIndicator={false}>
        {/* Photo Gallery Carousel */}
        <View style={s.galleryContainer}>
          <View style={s.gallerySlide}>
            <Text style={s.galleryEmoji}>{samplePhotos[activePhotoIndex].split(' ')[0]}</Text>
            <Text style={s.galleryCaption}>{samplePhotos[activePhotoIndex].split(' ').slice(1).join(' ')}</Text>
          </View>
          <View style={s.photoCounterPill}>
            <Text style={s.photoCounterText}>{activePhotoIndex + 1} / {samplePhotos.length}</Text>
          </View>
          <View style={s.photoThumbnailRow}>
            {samplePhotos.map((photo, i) => (
              <Pressable
                key={photo}
                onPress={() => setActivePhotoIndex(i)}
                style={[s.photoThumbItem, activePhotoIndex === i && s.photoThumbItemActive]}
              >
                <Text style={s.photoThumbEmoji}>{photo.split(' ')[0]}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Title, Pricing & Zero-Brokerage Badge */}
        <View style={s.mainHeaderSection}>
          <View style={s.typeTagRow}>
            <View style={s.roomTypeTag}>
              <Text style={s.roomTypeTagText}>{room.roomType}</Text>
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

          {/* Pricing & Terms Card */}
          <View style={s.pricingCard}>
            <View style={s.priceMainCol}>
              <View style={s.priceRow}>
                <Text style={s.priceValue}>${room.price}</Text>
                <Text style={s.pricePeriod}>/ month</Text>
              </View>
              <Text style={s.utilitiesText}>⚡ Direct Community Listing • Zero Brokerage</Text>
            </View>
            <View style={s.priceMetaCol}>
              <Text style={s.depositText}>Type: <Text style={s.depositVal}>{room.roomType}</Text></Text>
              <Text style={s.leaseText}>Status: <Text style={s.depositVal}>{room.status}</Text></Text>
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
              <Text style={s.hostReplyText}>⚡ Direct contact upon inquiry • Zero Brokerage</Text>
            </View>
          </View>
        </View>

        {/* Desi Flatmate Compatibility & Lifestyle */}
        <View style={s.sectionBlock}>
          <Text style={s.sectionHeading}>Flatmate Compatibility & Lifestyle</Text>
          <Text style={s.sectionSubtitle}>Preferences requested by the current flatmates</Text>
          <View style={s.preferencesGrid}>
            {(room.preferences ?? []).map((pref) => (
              <View key={pref} style={s.preferencePill}>
                <Text style={s.preferencePillText}>{pref}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Room & Apartment Amenities Grid */}
        <View style={s.sectionBlock}>
          <Text style={s.sectionHeading}>Included Amenities</Text>
          <View style={s.amenitiesGrid}>
            {(room.amenities ?? []).map((amenity) => (
              <View key={amenity} style={s.amenityItem}>
                <View style={s.amenityCheckCircle}>
                  <AppIcon color={colors.teal} name="check" size={12} strokeWidth={3} />
                </View>
                <Text style={s.amenityLabel}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Description Section */}
        <View style={s.sectionBlock}>
          <Text style={s.sectionHeading}>About this Home</Text>
          <Text style={s.descriptionText}>{room.description}</Text>
        </View>

        {/* Privacy & Location Notice */}
        <View style={s.privacyNoticeCard}>
          <AppIcon color={colors.appPrimary} name="shield" size={20} />
          <View style={s.privacyNoticeContent}>
            <Text style={s.privacyNoticeTitle}>Location Privacy Protected</Text>
            <Text style={s.privacyNoticeBody}>
              Approximate neighborhood shown for member safety. The exact street address and unit number are shared automatically once your booking inquiry is accepted by the host.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ─── Sticky Bottom Bar ─────────────────────────────────────────────────── */}
      <View style={[s.bottomBar, isDesktop && s.bottomBarDesktop]}>
        <View style={s.bottomPriceCol}>
          <View style={s.priceRow}>
            <Text style={s.bottomPriceVal}>${room.price}</Text>
            <Text style={s.bottomPricePeriod}>/mo</Text>
          </View>
          <Text style={s.bottomDeposit}>Direct Owner Listing</Text>
        </View>

        <View style={s.bottomActions}>
          <Link href={`/chat/new?recipient=host`} asChild>
            <Pressable style={StyleSheet.flatten(s.chatBtn)} accessibilityLabel="Chat with Host">
              <AppIcon color={colors.appPrimary} name="message" size={16} />
              <Text style={s.chatBtnText}>Chat</Text>
            </Pressable>
          </Link>
          <Link href={`/rooms/${roomId}/inquiry` as Href} asChild>
            <Pressable style={StyleSheet.flatten(s.inquireCtaBtn)} accessibilityLabel="Send Inquiry">
              <Text style={s.inquireCtaBtnText}>Send Inquiry</Text>
            </Pressable>
          </Link>
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
    backgroundColor: colors.surfaceContainerLow,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gallerySlide: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  galleryEmoji: {
    fontSize: 64,
  },
  galleryCaption: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  photoCounterPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  photoCounterText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  photoThumbnailRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: 'center',
  },
  photoThumbItem: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoThumbItemActive: {
    borderColor: colors.appPrimary,
    backgroundColor: colors.surfaceContainer,
  },
  photoThumbEmoji: {
    fontSize: 20,
  },
  mainHeaderSection: {
    gap: space.x2,
  },
  typeTagRow: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: 'rgba(67,30,190,0.18)',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: space.x4,
    marginTop: space.x2,
  },
  priceMainCol: {
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceValue: {
    color: colors.appPrimary,
    fontSize: 26,
    fontWeight: '900',
  },
  pricePeriod: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  utilitiesText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '700',
  },
  priceMetaCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  depositText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  depositVal: {
    color: colors.ink,
    fontWeight: '800',
  },
  leaseText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  hostCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: space.x4,
  },
  hostCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
  },
  hostCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.appPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostCardAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  hostCardInfo: {
    flex: 1,
    gap: 2,
  },
  hostNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  verifiedHostPillText: {
    color: colors.teal,
    fontSize: 10,
    fontWeight: '800',
  },
  hostWorkText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  hostReplyText: {
    color: colors.appPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionBlock: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: space.x4,
    gap: space.x2,
  },
  sectionHeading: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  preferencePill: {
    backgroundColor: 'rgba(67,30,190,0.06)',
    borderColor: 'rgba(67,30,190,0.16)',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.x3,
    paddingVertical: 6,
  },
  preferencePillText: {
    color: colors.appPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
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
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.appPrimary,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: space.x4,
    paddingVertical: 10,
  },
  chatBtnText: {
    color: colors.appPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  inquireCtaBtn: {
    backgroundColor: colors.appPrimary,
    borderRadius: radius.pill,
    paddingHorizontal: space.x5,
    paddingVertical: 10,
  },
  inquireCtaBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});
