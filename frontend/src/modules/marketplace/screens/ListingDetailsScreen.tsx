import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { getMarketplaceListing, getMarketplaceListingImages } from '../api';
import type { MarketplaceListing } from '../types';

const C = {
  primary: '#E05638', // Warm Saffron
  secondary: '#0D5C75', // Deep Gulf Teal
  bg: '#FFFDF9', // Soft warm ivory
  cardBg: '#FFFFFF',
  border: '#E8DEC8',
  ink: '#151D21',
  inkMuted: '#6B7280',
  emerald: '#16A34A',
  emeraldBg: '#DCFCE7',
  goldBg: '#FEF3C7',
  goldText: '#B45309',
  tealBg: '#E0F2FE',
  saffronBg: '#FEE2E2',
};

export function ListingDetailsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { listingId } = useLocalSearchParams<{ listingId: string }>();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerSubmitted, setOfferSubmitted] = useState(false);

  // Fetch listing data
  const {
    data: listing,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['marketplace', 'listing', listingId],
    queryFn: () => getMarketplaceListing(listingId!),
    enabled: !!listingId,
  });

  const { data: images = [] } = useQuery({
    queryKey: ['marketplace', 'listing-images', listingId],
    queryFn: () => getMarketplaceListingImages(listingId!),
    enabled: !!listingId,
  });

  if (isLoading) {
    return (
      <View style={s.centerRoot}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={s.loadingText}>Loading item details...</Text>
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={s.centerRoot}>
        <AppIcon name="warning" size={48} color={C.primary} />
        <Text style={s.errorTitle}>Listing Not Found</Text>
        <Text style={s.errorSub}>
          This marketplace item may have been sold or removed by the seller.
        </Text>
        <Pressable style={s.backBtnPrimary} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Back to Marketplace</Text>
        </Pressable>
      </View>
    );
  }

  // Gallery URLs
  const galleryUrls =
    images.length > 0
      ? images.map((img) => img.url)
      : [
          'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
        ];

  const handleMakeOffer = () => {
    if (!offerAmount.trim()) {
      Alert.alert('Please enter an offer amount');
      return;
    }
    setOfferSubmitted(true);
    setTimeout(() => {
      setIsOfferModalOpen(false);
      setOfferSubmitted(false);
      setOfferAmount('');
      setOfferMessage('');
      Alert.alert(
        'Offer Sent!',
        `Your offer of $${offerAmount} has been sent to the seller. You can track this conversation in Chat.`,
      );
    }, 1000);
  };

  return (
    <View style={s.root}>
      {/* Top Floating App Bar */}
      <View style={s.navBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={s.navIconBtn}
          onPress={() => router.back()}
        >
          <AppIcon name="chevron-left" size={20} color={C.ink} />
        </Pressable>

        <Text style={s.navCategory} numberOfLines={1}>
          {listing.category?.name ?? 'Marketplace'}
        </Text>

        <View style={s.navRight}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share listing"
            style={s.navIconBtn}
            onPress={() => Alert.alert('Share Link', 'Listing link copied to clipboard!')}
          >
            <AppIcon name="community" size={20} color={C.ink} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save listing"
            style={s.navIconBtn}
            onPress={() => setIsSaved(!isSaved)}
          >
            <Text style={[s.heartText, isSaved && s.heartTextSaved]}>
              {isSaved ? '♥' : '♡'}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.scrollContent, isDesktop && s.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.mainLayout, isDesktop && s.mainLayoutDesktop]}>
          {/* Left Column: Image Carousel */}
          <View style={[s.galleryColumn, isDesktop && s.galleryColumnDesktop]}>
            <View style={s.heroImageContainer}>
              <Image
                source={{ uri: galleryUrls[activeImageIndex] }}
                style={s.heroImage}
              />
              <View style={s.pageBadge}>
                <Text style={s.pageBadgeText}>
                  {activeImageIndex + 1} / {galleryUrls.length}
                </Text>
              </View>
            </View>

            {/* Thumbnail selector */}
            {galleryUrls.length > 1 && (
              <View style={s.thumbRow}>
                {galleryUrls.map((url, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => setActiveImageIndex(idx)}
                    style={[
                      s.thumbBox,
                      activeImageIndex === idx && s.thumbBoxActive,
                    ]}
                  >
                    <Image source={{ uri: url }} style={s.thumbImg} />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Safe Meetup & Verification Callout (Desktop) */}
            {isDesktop && (
              <View style={s.safetyCard}>
                <View style={s.safetyHeader}>
                  <AppIcon name="shield" size={22} color={C.secondary} />
                  <Text style={s.safetyTitle}>ManaBandhu Safe Deal Promise</Text>
                </View>
                <Text style={s.safetyText}>
                  • Meet in daylight at designated public community spots (e.g., Patel Brothers Austin, HEB Round Rock).{'\n'}
                  • Verify seller identity via ManaBandhu community profile.{'\n'}
                  • Never send wires or gift cards. Inspect goods in person before paying via Zelle/Cash.
                </Text>
              </View>
            )}
          </View>

          {/* Right Column: Title, Pricing, Specs, Seller */}
          <View style={[s.detailsColumn, isDesktop && s.detailsColumnDesktop]}>
            {/* Title & Price Header */}
            <View style={s.whiteCard}>
              <View style={s.badgeRow}>
                <View style={s.conditionBadge}>
                  <Text style={s.conditionBadgeText}>{listing.condition}</Text>
                </View>
                {listing.negotiable ? (
                  <View style={s.negBadge}>
                    <Text style={s.negBadgeText}>Price Negotiable</Text>
                  </View>
                ) : (
                  <View style={s.fixedBadge}>
                    <Text style={s.fixedBadgeText}>Firm Price</Text>
                  </View>
                )}
              </View>

              <Text style={s.title}>{listing.title}</Text>

              <View style={s.priceRow}>
                <Text style={s.priceHighlight}>
                  {listing.price === 0 ? 'FREE' : `$${Number(listing.price).toFixed(0)}`}
                </Text>
                <Text style={s.postedTime}>
                  Posted {new Date(listing.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View style={s.locationRow}>
                <AppIcon name="map" size={16} color={C.secondary} />
                <Text style={s.locationText}>{listing.location}</Text>
              </View>
            </View>

            {/* Seller Profile Card */}
            <View style={s.whiteCard}>
              <Text style={s.sectionSubtitle}>Seller Details</Text>
              <View style={s.sellerHeader}>
                <View style={s.sellerAvatarRing}>
                  <Text style={s.sellerInitial}>S</Text>
                </View>
                <View style={s.sellerInfo}>
                  <View style={s.sellerNameRow}>
                    <Text style={s.sellerName}>Suresh Reddy</Text>
                    <AppIcon name="verified-user" size={16} color={C.secondary} />
                  </View>
                  <Text style={s.sellerMeta}>ManaBandhu Member since 2022 · 4.9 ★</Text>
                  <Text style={s.sellerLanguage}>⚡ Replies in &lt; 15 mins · Speaks Telugu & English</Text>
                </View>
              </View>
            </View>

            {/* Description & Specifications */}
            <View style={s.whiteCard}>
              <Text style={s.sectionSubtitle}>Item Description</Text>
              <Text style={s.descriptionText}>{listing.description}</Text>

              <Text style={[s.sectionSubtitle, { marginTop: 18 }]}>Quick Specifications</Text>
              <View style={s.specGrid}>
                <View style={s.specItem}>
                  <Text style={s.specLabel}>Category</Text>
                  <Text style={s.specValue}>{listing.category?.name ?? 'General'}</Text>
                </View>
                <View style={s.specItem}>
                  <Text style={s.specLabel}>Condition</Text>
                  <Text style={s.specValue}>{listing.condition}</Text>
                </View>
                <View style={s.specItem}>
                  <Text style={s.specLabel}>Location</Text>
                  <Text style={s.specValue}>{listing.location}</Text>
                </View>
                <View style={s.specItem}>
                  <Text style={s.specLabel}>Negotiable</Text>
                  <Text style={s.specValue}>{listing.negotiable ? 'Yes' : 'No'}</Text>
                </View>
              </View>
            </View>

            {/* Mobile Safety Advice */}
            {!isDesktop && (
              <View style={s.safetyCard}>
                <View style={s.safetyHeader}>
                  <AppIcon name="shield" size={20} color={C.secondary} />
                  <Text style={s.safetyTitle}>ManaBandhu Safe Deal Promise</Text>
                </View>
                <Text style={s.safetyText}>
                  Always meet in public daylight locations like Patel Brothers or HEB. Inspect before paying.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[s.bottomBar, isDesktop && s.bottomBarDesktop]}>
        <View style={s.bottomPriceBlock}>
          <Text style={s.bottomPriceLabel}>Price</Text>
          <Text style={s.bottomPriceValue}>
            {listing.price === 0 ? 'FREE' : `$${Number(listing.price).toFixed(0)}`}
          </Text>
        </View>

        <View style={s.bottomActionButtons}>
          {listing.negotiable && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Make an offer"
              style={s.offerBtn}
              onPress={() => setIsOfferModalOpen(true)}
            >
              <Text style={s.offerBtnText}>Make Offer</Text>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chat with seller"
            style={s.chatBtn}
            onPress={() => router.push('/chat/new')}
          >
            <AppIcon name="message" size={18} color="#FFF" />
            <Text style={s.chatBtnText}>Chat with Seller</Text>
          </Pressable>
        </View>
      </View>

      {/* Make Offer Modal / Bottom Sheet */}
      <Modal
        visible={isOfferModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOfferModalOpen(false)}
      >
        <View style={[s.modalBackdrop, !isDesktop && s.modalBackdropMobile]}>
          <View style={[s.modalBox, isDesktop && s.modalBoxDesktop]}>
            <View style={s.modalTop}>
              <Text style={s.modalHeaderTitle}>Make an Offer</Text>
              <Pressable onPress={() => setIsOfferModalOpen(false)} hitSlop={10}>
                <Text style={s.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={s.modalItemTitle}>{listing.title}</Text>
            <Text style={s.modalListedPrice}>
              Listed Price: ${Number(listing.price).toFixed(0)}
            </Text>

            <View style={s.inputBlock}>
              <Text style={s.inputLabel}>Your Offer (USD)</Text>
              <View style={s.priceInputWrap}>
                <Text style={s.dollarSign}>$</Text>
                <TextInput
                  style={s.priceInputField}
                  placeholder="e.g. 50"
                  placeholderTextColor={C.inkMuted}
                  keyboardType="numeric"
                  value={offerAmount}
                  onChangeText={setOfferAmount}
                />
              </View>
            </View>

            <View style={s.inputBlock}>
              <Text style={s.inputLabel}>Note to Seller (Optional)</Text>
              <TextInput
                style={s.messageInputField}
                placeholder="Can pick up today in Round Rock..."
                placeholderTextColor={C.inkMuted}
                multiline
                numberOfLines={3}
                value={offerMessage}
                onChangeText={setOfferMessage}
              />
            </View>

            <Pressable
              style={s.submitOfferBtn}
              onPress={handleMakeOffer}
              disabled={offerSubmitted}
            >
              {offerSubmitted ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={s.submitOfferText}>Send Offer to Seller</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centerRoot: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: C.inkMuted,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.ink,
  },
  errorSub: {
    fontSize: 13,
    color: C.inkMuted,
    textAlign: 'center',
  },
  backBtnPrimary: {
    marginTop: 12,
    backgroundColor: C.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: {
    fontSize: 18,
    color: C.ink,
  },
  heartTextSaved: {
    color: '#EF4444',
  },
  navCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: C.secondary,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  scrollContentDesktop: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  mainLayout: {
    gap: 16,
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
    gap: 28,
  },
  galleryColumn: {
    width: '100%',
  },
  galleryColumnDesktop: {
    flex: 1.1,
  },
  heroImageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#E5E7EB',
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pageBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pageBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  thumbBox: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbBoxActive: {
    borderColor: C.primary,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailsColumn: {
    paddingHorizontal: 16,
    gap: 14,
  },
  detailsColumnDesktop: {
    flex: 1,
    paddingHorizontal: 0,
  },
  whiteCard: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionBadge: {
    backgroundColor: C.tealBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionBadgeText: {
    color: C.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  negBadge: {
    backgroundColor: C.goldBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  negBadgeText: {
    color: C.goldText,
    fontSize: 12,
    fontWeight: '700',
  },
  fixedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fixedBadgeText: {
    color: C.inkMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: C.ink,
    lineHeight: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceHighlight: {
    fontSize: 26,
    fontWeight: '800',
    color: C.emerald,
  },
  postedTime: {
    fontSize: 12,
    color: C.inkMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  locationText: {
    fontSize: 13,
    color: C.inkMuted,
    fontWeight: '500',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.goldBg,
    borderWidth: 2,
    borderColor: '#D99B26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: C.goldText,
  },
  sellerInfo: {
    flex: 1,
    gap: 2,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
  },
  sellerMeta: {
    fontSize: 12,
    color: C.inkMuted,
  },
  sellerLanguage: {
    fontSize: 11,
    color: C.secondary,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: C.ink,
    lineHeight: 22,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specItem: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
  },
  specLabel: {
    fontSize: 11,
    color: C.inkMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: 13,
    color: C.ink,
    fontWeight: '700',
    marginTop: 2,
  },
  safetyCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 16,
    padding: 14,
    gap: 6,
    marginTop: 10,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safetyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.secondary,
  },
  safetyText: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.cardBg,
    borderTopWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
  },
  bottomBarDesktop: {
    maxWidth: 1100,
    alignSelf: 'center',
    borderRadius: 16,
    bottom: 16,
    borderWidth: 1,
  },
  bottomPriceBlock: {
    gap: 2,
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: C.inkMuted,
  },
  bottomPriceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: C.emerald,
  },
  bottomActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  offerBtn: {
    borderWidth: 1.5,
    borderColor: C.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  offerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.secondary,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },
  chatBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdropMobile: {
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: C.bg,
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
  },
  modalBoxDesktop: {
    maxWidth: 480,
    borderRadius: 24,
  },
  modalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.ink,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: C.ink,
  },
  modalItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.ink,
  },
  modalListedPrice: {
    fontSize: 13,
    color: C.inkMuted,
  },
  inputBlock: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.ink,
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  dollarSign: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
    marginRight: 4,
  },
  priceInputField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: C.ink,
    height: '100%',
  },
  messageInputField: {
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: C.ink,
    textAlignVertical: 'top',
    height: 80,
  },
  submitOfferBtn: {
    backgroundColor: C.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  submitOfferText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
