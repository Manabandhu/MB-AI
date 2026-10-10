import { color as colors, palette, radius, space, typography } from '@manabandhu/design-system';
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

const CONDITIONS = [
  { id: 'Brand New', label: 'Brand New', subtext: 'Unopened, with tags/box' },
  { id: 'Like New', label: 'Like New', subtext: 'Used minimally, pristine condition' },
  { id: 'Gently Used', label: 'Gently Used', subtext: 'Normal wear, 100% functional' },
  { id: 'Fair', label: 'Fair', subtext: 'Noticeable wear, priced to move' },
] as const;

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [condition, setCondition] = useState<string>('Like New');
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState('');
  const [negotiable, setNegotiable] = useState(true);
  const [location, setLocation] = useState('');
  const [safePickupSpot, setSafePickupSpot] = useState('');
  const [_publicSpotOnly, _setPublicSpotOnly] = useState(true);
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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
    const numPrice = isFree ? 0 : Number.parseFloat(price);
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      setErrorMsg('Please enter a price, or choose Give for Free');
      return;
    }
    const categoryId = selectedCategory;
    if (!categoryId) {
      setErrorMsg('Please choose a category');
      return;
    }

    const extras = [
      selectedTags.length > 0 ? `Tags: ${selectedTags.join(', ')}` : null,
      safePickupSpot.trim() ? `Pickup: ${safePickupSpot.trim()}` : null,
    ].filter(Boolean);
    const fullDesc = [description.trim(), extras.join('\n')].filter(Boolean).join('\n\n');

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
            Your listing is now live in the community marketplace.
          </Text>
          <View style={s.successCard}>
            <Text style={s.successItemTitle}>{title}</Text>
            <Text style={s.successItemPrice}>{isFree ? 'FREE Giveaway' : `$${price}`}</Text>
            {safePickupSpot.trim() ? (
              <Text style={s.successItemSpot}>📍 Pickup: {safePickupSpot.trim()}</Text>
            ) : null}
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
            <Text style={s.topBarSubtitle}>List an item for the community</Text>
          </View>
          <View style={s.iconBtn} />
        </View>

        <ScrollView style={s.flex} contentContainerStyle={s.content}>
          {/* Trust Banner */}
          <View style={s.trustBanner}>
            <View style={s.trustIconBox}>
              <AppIcon name="shield" size={20} color={colors.teal} />
            </View>
            <View style={s.trustContent}>
              <Text style={s.trustTitle}>Community Marketplace</Text>
              <Text style={s.trustText}>
                Buyers contact you directly through chat. Agree on price and pickup together.
              </Text>
            </View>
          </View>

          {/* Photos are not uploaded from this screen yet; say so instead of showing mock photos. */}
          <View style={s.tipBox}>
            <Text style={s.tipText}>
              Photo upload is not available yet. Describe the item clearly.
            </Text>
          </View>

          {/* Item Details Card */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Item Details</Text>

            <Text style={s.inputLabel}>Listing Title *</Text>
            <TextInput
              style={s.textInput}
              placeholder="e.g. Mixer grinder (110V US model)"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
            <Text style={s.charCount}>{title.length}/80 characters</Text>

            <Text style={s.inputLabel}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillsRow}>
              {backendCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={[s.catPill, isSelected && s.catPillActive]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={[s.catPillText, isSelected && s.catPillTextActive]}>
                      {cat.name}
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
                <Text style={[s.segmentText, isFree && s.segmentTextActive]}>🎁 Give for Free</Text>
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
              </View>
            ) : (
              <View style={s.freeCallout}>
                <Text style={s.freeCalloutText}>
                  ✨ Thank you for giving back to the community!
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
            <Text style={s.sectionTitle}>Location & Pickup</Text>

            <Text style={s.inputLabel}>Neighborhood / Metro Area</Text>
            <View style={s.inputWithIcon}>
              <AppIcon name="map" size={18} color={colors.primary} />
              <TextInput
                style={s.textInputInner}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Neighborhood, City, State"
              />
            </View>

            <Text style={s.inputLabel}>Pickup Spot (optional)</Text>
            <View style={s.safeSpotCard}>
              <TextInput
                style={s.textInput}
                value={safePickupSpot}
                onChangeText={setSafePickupSpot}
                placeholder="Optional: a busy public place for pickup"
                placeholderTextColor={colors.muted}
              />
              <Text style={s.safeSpotHelper}>
                We recommend meeting in daylight at a busy public place.
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
              <Text style={s.sellerAvatarText}>
                {(user?.user_metadata?.full_name ?? user?.email ?? '?')[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={s.sellerInfo}>
              <Text style={s.sellerName}>
                Posting as {user?.user_metadata?.full_name ?? user?.email ?? 'your account'}
              </Text>
            </View>
          </View>

          {errorMsg ? <Text style={s.errorText}>{errorMsg}</Text> : null}
          <View style={s.bottomSpacer} />
        </ScrollView>

        {/* Fixed Bottom Action Bar */}
        <View style={s.bottomBar}>
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

  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
    backgroundColor: palette.tealBg,
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
  sectionTitle: { ...typography.h4, color: colors.ink, fontWeight: '800' },

  tipBox: {
    backgroundColor: '#fff9ed',
    padding: space.x2,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: '#fce4be',
  },
  tipText: { ...typography.caption, color: colors.warm, fontWeight: '600' },

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
