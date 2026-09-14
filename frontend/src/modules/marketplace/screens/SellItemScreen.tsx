import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/authStore';
import { createMarketplaceListing, listMarketplaceCategories } from '@/modules/marketplace/api';
import type { CreateListingInput } from '@/modules/marketplace/types';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const CATEGORIES = [
  { id: 'kitchen', label: 'Kitchen & Appliances', icon: 'utensils' },
  { id: 'furniture', label: 'Furniture & Home', icon: 'home' },
  { id: 'ethnic', label: 'Ethnic Wear & Jewelry', icon: 'sparkles' },
  { id: 'sports', label: 'Cricket & Sports', icon: 'award' },
  { id: 'puja', label: 'Puja & Festival Items', icon: 'flame' },
  { id: 'electronics', label: 'Electronics', icon: 'laptop' },
  { id: 'kids', label: 'Baby & Kids', icon: 'smile' },
] as const;

const CONDITIONS = [
  { id: 'Brand New', label: 'Brand New', subtext: 'Unopened, with tags/box' },
  { id: 'Like New', label: 'Like New', subtext: 'Used minimally, pristine condition' },
  { id: 'Gently Used', label: 'Gently Used', subtext: 'Normal wear, 100% functional' },
  { id: 'Fair', label: 'Fair', subtext: 'Noticeable wear, priced to move' },
] as const;

const SAFE_PICKUP_SPOTS = [
  'Patel Brothers (Round Rock)',
  'H-E-B (University Blvd, Round Rock)',
  'India Bazaar (Plano/Frisco)',
  'Whole Foods (Domain, Austin)',
  'Patel Brothers (Irving/MacArthur)',
];

const COMMUNITY_TAGS = [
  '110V US Voltage',
  'Relocation Sale',
  'Chutney / Batter Tested',
  'Speaks Telugu & Hindi',
  'Moving to California',
  'Original India Import',
  'Vegetarian Household',
];

export function SellItemScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // Form states
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('kitchen');
  const [condition, setCondition] = useState<string>('Like New');
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState('65');
  const [originalPrice, _setOriginalPrice] = useState('135');
  const [negotiable, setNegotiable] = useState(true);
  const [location, setLocation] = useState('Round Rock / North Austin, TX');
  const [safePickupSpot, setSafePickupSpot] = useState(SAFE_PICKUP_SPOTS[0]);
  const [_publicSpotOnly, _setPublicSpotOnly] = useState(true);
  const [description, setDescription] = useState(
    'Works flawlessly on 110V US sockets without converter. 2 stainless steel jars (1.5L wet + 0.5L chutney) with spare coupler and original box.',
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([
    '110V US Voltage',
    'Relocation Sale',
    'Chutney / Batter Tested',
  ]);
  const [photoCount, setPhotoCount] = useState(2);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  // Load backend categories
  const { data: backendCategories = [] } = useQuery({
    queryKey: ['marketplace', 'categories'],
    queryFn: listMarketplaceCategories,
  });

  const mutation = useMutation({
    mutationFn: createMarketplaceListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] });
      setPublished(true);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
      Alert.alert('Listing Creation Failed', err.message);
    },
  });

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handlePublish = () => {
    setErrorMsg(null);
    if (!title.trim()) {
      setErrorMsg('Please enter an item title');
      return;
    }
    const numPrice = isFree ? 0.01 : parseFloat(price) || 1;
    const catMatch = backendCategories.find(
      (c) => c.slug === selectedCategory || c.name.toLowerCase().includes(selectedCategory),
    );
    const categoryId = catMatch?.id ?? '00000000-0000-0000-0000-000000000001';

    const fullDesc =
      selectedTags.length > 0
        ? `${description.trim()}\n\nTags: ${selectedTags.join(', ')}\nPickup: ${safePickupSpot}`
        : `${description.trim()}\nPickup: ${safePickupSpot}`;

    const payload: CreateListingInput = {
      categoryId,
      title: title.trim(),
      description: fullDesc,
      price: numPrice,
      currency: 'USD',
      condition,
      location: location.trim(),
      negotiable: !isFree && negotiable,
    };

    mutation.mutate(payload);
  };

  if (published) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.successContainer}>
          <View style={s.successIconCircle}>
            <AppIcon name="check" size={36} color="#ffffff" />
          </View>
          <Text style={s.successTitle}>Item Listed on Marketplace! 🎉</Text>
          <Text style={s.successSubtitle}>
            Your listing is now active and visible to verified Telugu and Indian community members
            in {location}.
          </Text>
          <View style={s.successCard}>
            <Text style={s.successItemTitle}>{title}</Text>
            <Text style={s.successItemPrice}>{isFree ? 'FREE Giveaway' : `$${price}`}</Text>
            <Text style={s.successItemSpot}>📍 Safe Daylight Pickup: {safePickupSpot}</Text>
          </View>
          <View style={s.successActions}>
            <Pressable style={s.primaryBtn} onPress={() => router.replace('/marketplace')}>
              <Text style={s.primaryBtnText}>View in Marketplace</Text>
            </Pressable>
            <Pressable
              style={s.outlineBtn}
              onPress={() => {
                setPublished(false);
                setTitle('');
              }}
            >
              <Text style={s.outlineBtnText}>List Another Item</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.flex}>
        {/* Top Navigation Bar */}
        <View style={s.topBar}>
          <Pressable style={s.iconBtn} onPress={() => router.back()}>
            <AppIcon name="chevron-left" size={24} color={colors.ink} />
          </Pressable>
          <View style={s.topBarCenter}>
            <Text style={s.topBarTitle}>Sell an Item</Text>
            <Text style={s.topBarSubtitle}>100% Free • 0% Brokerage</Text>
          </View>
          <Pressable
            style={s.draftsBtn}
            onPress={() => Alert.alert('Drafts', 'Listing draft saved.')}
          >
            <Text style={s.draftsBtnText}>Drafts (1)</Text>
          </Pressable>
        </View>

        <ScrollView style={s.flex} contentContainerStyle={s.content}>
          {/* Trust Banner */}
          <View style={s.trustBanner}>
            <View style={s.trustIconBox}>
              <AppIcon name="shield" size={20} color={colors.teal} />
            </View>
            <View style={s.trustContent}>
              <Text style={s.trustTitle}>Zero-Brokerage Community Marketplace</Text>
              <Text style={s.trustText}>
                No fees, no middlemen. Connect directly with local verified Telugu & Desi Bandhus.
              </Text>
            </View>
          </View>

          {/* Photo Uploader Section */}
          <View style={s.card}>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionTitle}>Item Photos</Text>
              <Text style={s.sectionCount}>({photoCount}/8 photos added)</Text>
            </View>
            <View style={s.tipBox}>
              <Text style={s.tipText}>
                💡 Clear, well-lit photos sell 3x faster in local community groups.
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photosRow}>
              {/* Cover photo slot */}
              <View style={s.photoSlotCover}>
                <View style={s.coverBadge}>
                  <Text style={s.coverBadgeText}>★ Cover Photo</Text>
                </View>
                <View style={s.mockImagePlaceholder}>
                  <AppIcon name="package" size={32} color={colors.primary} />
                  <Text style={s.mockImageLabel}>Preethi Eco Twin</Text>
                </View>
              </View>

              {/* Photo 2 slot */}
              <View style={s.photoSlotFilled}>
                <View style={s.mockImagePlaceholder}>
                  <AppIcon name="package" size={28} color={colors.muted} />
                  <Text style={s.mockImageLabel}>Stainless Jars</Text>
                </View>
              </View>

              {/* Add more button */}
              <Pressable
                style={s.photoSlotAdd}
                onPress={() => {
                  setPhotoCount((c) => Math.min(c + 1, 8));
                  Alert.alert('Add Photo', 'Photo added from device library.');
                }}
              >
                <AppIcon name="plus" size={24} color={colors.primary} />
                <Text style={s.addPhotoText}>+ Add</Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Item Details Card */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Item Details</Text>

            <Text style={s.inputLabel}>Listing Title *</Text>
            <TextInput
              style={s.textInput}
              placeholder="e.g. Preethi Eco Twin Mixer Grinder 550W (110V US Model)"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
            <Text style={s.charCount}>{title.length}/80 characters</Text>

            <Text style={s.inputLabel}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillsRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={[s.catPill, isSelected && s.catPillActive]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={[s.catPillText, isSelected && s.catPillTextActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={s.inputLabel}>Condition *</Text>
            <View style={s.conditionsGrid}>
              {CONDITIONS.map((cond) => {
                const isSelected = condition === cond.id;
                return (
                  <Pressable
                    key={cond.id}
                    style={[s.condCard, isSelected && s.condCardActive]}
                    onPress={() => setCondition(cond.id)}
                  >
                    <View style={s.condHeaderRow}>
                      <Text style={[s.condTitle, isSelected && s.condTitleActive]}>
                        {cond.label}
                      </Text>
                      <View style={[s.radioCircle, isSelected && s.radioCircleActive]}>
                        {isSelected ? <View style={s.radioDot} /> : null}
                      </View>
                    </View>
                    <Text style={s.condSubtext}>{cond.subtext}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Pricing & Goodwill Card */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Pricing & Community Goodwill</Text>

            {/* Price / Free Switch */}
            <View style={s.segmentedControl}>
              <Pressable
                style={[s.segmentBtn, !isFree && s.segmentBtnActive]}
                onPress={() => setIsFree(false)}
              >
                <Text style={[s.segmentText, !isFree && s.segmentTextActive]}>Set Price ($)</Text>
              </Pressable>
              <Pressable
                style={[s.segmentBtn, isFree && s.segmentBtnActive]}
                onPress={() => setIsFree(true)}
              >
                <Text style={[s.segmentText, isFree && s.segmentTextActive]}>
                  🎁 Give for Free (Zero Waste)
                </Text>
              </Pressable>
            </View>

            {!isFree ? (
              <View style={s.priceRow}>
                <View style={s.priceInputBox}>
                  <Text style={s.currencyPrefix}>$</Text>
                  <TextInput
                    style={s.priceInput}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0"
                  />
                </View>
                <View style={s.msrpBox}>
                  <Text style={s.msrpLabel}>Original Retail: ${originalPrice}</Text>
                  <Text style={s.discountBadge}>~52% Off</Text>
                </View>
              </View>
            ) : (
              <View style={s.freeCallout}>
                <Text style={s.freeCalloutText}>
                  ✨ Thank you for giving back to the community! Free items are featured in the
                  Zero-Waste diaspora circle.
                </Text>
              </View>
            )}

            {!isFree && (
              <Pressable style={s.checkboxRow} onPress={() => setNegotiable(!negotiable)}>
                <View style={[s.checkbox, negotiable && s.checkboxChecked]}>
                  {negotiable ? <AppIcon name="check" size={14} color="#ffffff" /> : null}
                </View>
                <Text style={s.checkboxLabel}>Price is negotiable for students & newcomers</Text>
              </Pressable>
            )}
          </View>

          {/* Location & Safe Pickup Card */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Location & Safe Desi Pickup</Text>

            <Text style={s.inputLabel}>Neighborhood / Metro Area</Text>
            <View style={s.inputWithIcon}>
              <AppIcon name="map" size={18} color={colors.primary} />
              <TextInput
                style={s.textInputInner}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Round Rock / North Austin, TX"
              />
            </View>

            <Text style={s.inputLabel}>Recommended Daylight Community Pickup Spot</Text>
            <View style={s.safeSpotCard}>
              <View style={s.safeSpotHeader}>
                <AppIcon name="shield" size={16} color={colors.teal} />
                <Text style={s.safeSpotBadge}>✓ Verified Public Community Spot</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillsRow}>
                {SAFE_PICKUP_SPOTS.map((spot) => {
                  const isSelected = safePickupSpot === spot;
                  return (
                    <Pressable
                      key={spot}
                      style={[s.spotPill, isSelected && s.spotPillActive]}
                      onPress={() => setSafePickupSpot(spot)}
                    >
                      <Text style={[s.spotPillText, isSelected && s.spotPillTextActive]}>
                        {spot}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Text style={s.safeSpotHelper}>
                We recommend meeting at well-lit Indian supermarkets or grocery parking lots.
              </Text>
            </View>
          </View>

          {/* Description & Cultural Tags Card */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Description & Community Tags</Text>

            <TextInput
              style={s.textArea}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe condition, reason for selling, accessories included..."
              placeholderTextColor={colors.muted}
            />

            <Text style={s.inputLabel}>Quick Community Tags</Text>
            <View style={s.tagsWrap}>
              {COMMUNITY_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    style={[s.tagChip, isSelected && s.tagChipActive]}
                    onPress={() => handleTagToggle(tag)}
                  >
                    <Text style={[s.tagChipText, isSelected && s.tagChipTextActive]}>
                      {isSelected ? '✓ ' : '+ '}
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Seller Trust Banner */}
          <View style={s.sellerCard}>
            <View style={s.sellerAvatar}>
              <Text style={s.sellerAvatarText}>{user?.user_metadata?.full_name?.[0] ?? 'S'}</Text>
            </View>
            <View style={s.sellerInfo}>
              <Text style={s.sellerName}>
                Posting as {user?.user_metadata?.full_name ?? 'Suresh Reddy'}
              </Text>
              <Text style={s.sellerSubtext}>
                Verified Bandhu • Dell Corporate Email • Round Rock Community
              </Text>
            </View>
          </View>

          {errorMsg ? <Text style={s.errorText}>{errorMsg}</Text> : null}
          <View style={s.bottomSpacer} />
        </ScrollView>

        {/* Fixed Bottom Action Bar */}
        <View style={s.bottomBar}>
          <Pressable
            style={s.saveDraftBtn}
            onPress={() => Alert.alert('Saved', 'Saved to your drafts folder')}
          >
            <Text style={s.saveDraftText}>Save Draft</Text>
          </Pressable>
          <Pressable
            style={[s.publishBtn, mutation.isPending && s.publishBtnDisabled]}
            onPress={handlePublish}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={s.publishBtnText}>Publish Listing Now →</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.x4, gap: space.x4 },
  bottomSpacer: { height: 80 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: { padding: space.x1 },
  topBarCenter: { alignItems: 'center' },
  topBarTitle: { ...typography.h3, color: colors.ink, fontWeight: '800' },
  topBarSubtitle: { ...typography.caption, color: colors.teal, fontWeight: '700' },
  draftsBtn: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: space.x3,
    paddingVertical: space.x1,
    borderRadius: radius.pill,
  },
  draftsBtnText: { ...typography.caption, color: colors.primary, fontWeight: '700' },

  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
    backgroundColor: '#e6f4f4',
    padding: space.x3,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#b2dede',
  },
  trustIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustContent: { flex: 1 },
  trustTitle: { ...typography.bodyStrong, color: colors.teal, fontSize: 13 },
  trustText: { ...typography.caption, color: colors.ink, fontSize: 11 },

  card: {
    backgroundColor: colors.surface,
    padding: space.x4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.x3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { ...typography.h4, color: colors.ink, fontWeight: '800' },
  sectionCount: { ...typography.caption, color: colors.muted },

  tipBox: {
    backgroundColor: '#fff9ed',
    padding: space.x2,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: '#fce4be',
  },
  tipText: { ...typography.caption, color: colors.warm, fontWeight: '600' },

  photosRow: { flexDirection: 'row', gap: space.x2, marginTop: space.x1 },
  photoSlotCover: {
    width: 130,
    height: 110,
    borderRadius: radius.control,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
    position: 'relative',
  },
  coverBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    zIndex: 2,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  coverBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '800' },
  mockImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.x2,
  },
  mockImageLabel: { ...typography.caption, color: colors.ink, fontSize: 10, marginTop: 4 },
  photoSlotFilled: {
    width: 100,
    height: 110,
    borderRadius: radius.control,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  photoSlotAdd: {
    width: 80,
    height: 110,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf8ff',
  },
  addPhotoText: { ...typography.caption, color: colors.primary, fontWeight: '700' },

  inputLabel: { ...typography.bodyStrong, color: colors.ink, fontSize: 13, marginTop: space.x1 },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: space.x3,
    paddingVertical: space.x2,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  charCount: { ...typography.caption, color: colors.muted, textAlign: 'right' },

  pillsRow: { flexDirection: 'row', gap: space.x2, marginVertical: space.x1 },
  catPill: {
    paddingHorizontal: space.x3,
    paddingVertical: space.x2,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catPillText: { ...typography.caption, color: colors.ink, fontWeight: '600' },
  catPillTextActive: { color: '#ffffff', fontWeight: '800' },

  conditionsGrid: { gap: space.x2 },
  condCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    padding: space.x3,
    backgroundColor: colors.surface,
  },
  condCardActive: { borderColor: colors.primary, backgroundColor: '#f7f5ff' },
  condHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  condTitle: { ...typography.bodyStrong, color: colors.ink, fontSize: 14 },
  condTitleActive: { color: colors.primary },
  condSubtext: { ...typography.caption, color: colors.muted, marginTop: 2 },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  segmentedControl: {
    flexDirection: 'row',
    borderRadius: radius.control,
    backgroundColor: colors.background,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: { flex: 1, paddingVertical: space.x2, alignItems: 'center', borderRadius: 8 },
  segmentBtnActive: { backgroundColor: colors.surface, shadowOpacity: 0.05 },
  segmentText: { ...typography.caption, color: colors.muted, fontWeight: '600' },
  segmentTextActive: { color: colors.primary, fontWeight: '800' },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.x3,
  },
  priceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: space.x3,
  },
  currencyPrefix: { fontSize: 22, fontWeight: '800', color: colors.ink },
  priceInput: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.ink, paddingVertical: 8 },
  msrpBox: { alignItems: 'flex-end' },
  msrpLabel: { ...typography.caption, color: colors.muted, textDecorationLine: 'line-through' },
  discountBadge: { ...typography.caption, color: colors.teal, fontWeight: '800' },
  freeCallout: {
    backgroundColor: '#f2fbf6',
    padding: space.x3,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: '#bbf0d4',
  },
  freeCalloutText: { ...typography.caption, color: '#166534', fontWeight: '600' },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: space.x2, marginTop: 4 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: { ...typography.caption, color: colors.ink },

  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: space.x3,
  },
  textInputInner: { flex: 1, paddingVertical: space.x2, fontSize: 13, color: colors.ink },

  safeSpotCard: {
    backgroundColor: '#f7fbfa',
    padding: space.x3,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: '#d2e8e4',
    gap: space.x2,
  },
  safeSpotHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  safeSpotBadge: { ...typography.caption, color: colors.teal, fontWeight: '800' },
  spotPill: {
    paddingHorizontal: space.x3,
    paddingVertical: space.x2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  spotPillActive: { borderColor: colors.teal, backgroundColor: '#e2f4f2' },
  spotPillText: { ...typography.caption, color: colors.ink, fontSize: 11 },
  spotPillTextActive: { color: colors.teal, fontWeight: '800' },
  safeSpotHelper: { ...typography.caption, color: colors.muted, fontSize: 11 },

  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    padding: space.x3,
    fontSize: 13,
    color: colors.ink,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2, marginTop: 4 },
  tagChip: {
    paddingHorizontal: space.x3,
    paddingVertical: space.x1,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  tagChipText: { ...typography.caption, color: colors.ink, fontSize: 11, fontWeight: '600' },
  tagChipTextActive: { color: colors.primary, fontWeight: '800' },

  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
    backgroundColor: colors.surface,
    padding: space.x3,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  sellerInfo: { flex: 1 },
  sellerName: { ...typography.bodyStrong, color: colors.ink, fontSize: 13 },
  sellerSubtext: { ...typography.caption, color: colors.teal, fontSize: 11 },

  errorText: { color: colors.error, ...typography.caption, textAlign: 'center' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: space.x4,
    gap: space.x3,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveDraftBtn: {
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDraftText: { ...typography.bodyStrong, color: colors.ink, fontSize: 14 },
  publishBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: space.x3,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnDisabled: { opacity: 0.6 },
  publishBtnText: { ...typography.bodyStrong, color: '#ffffff', fontSize: 15, fontWeight: '800' },

  successContainer: {
    flex: 1,
    padding: space.x6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x4,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { ...typography.h2, color: colors.ink, textAlign: 'center', fontWeight: '800' },
  successSubtitle: { ...typography.body, color: colors.muted, textAlign: 'center' },
  successCard: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: space.x4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  successItemTitle: { ...typography.bodyStrong, color: colors.ink },
  successItemPrice: { ...typography.h3, color: colors.primary, fontWeight: '800' },
  successItemSpot: { ...typography.caption, color: colors.teal },
  successActions: { width: '100%', gap: space.x3, marginTop: space.x2 },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: space.x3,
    borderRadius: radius.control,
    alignItems: 'center',
  },
  primaryBtnText: { ...typography.bodyStrong, color: '#ffffff', fontSize: 15 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.x3,
    borderRadius: radius.control,
    alignItems: 'center',
  },
  outlineBtnText: { ...typography.bodyStrong, color: colors.ink, fontSize: 14 },
});
