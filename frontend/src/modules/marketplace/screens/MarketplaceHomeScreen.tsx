import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { listMarketplaceCategories, listMarketplaceListings } from '../api';
import type { MarketplaceListing } from '../types';

// Palette tokens aligned with ManaBandhu Modern Vibrant design system
const C = {
  primary: '#431ebe', // Royal Indigo
  secondary: '#00696b', // Deep Teal
  bg: '#faf8ff', // Soft pristine canvas
  cardBg: '#ffffff',
  border: '#e2e8f0',
  ink: '#131b2e',
  inkMuted: '#625f6e',
  emerald: '#1b873f',
  emeraldBg: '#e6f7ed',
  saffronBg: '#fff0e8',
  tealBg: '#e6f4f4',
  goldBg: '#fef3c7',
  goldText: '#b45309',
};

export function MarketplaceHomeScreen({ screenId }: { screenId?: string } = {}) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const isDesktop = width >= 768;

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [under50Only, setUnder50Only] = useState(false);
  const [negotiableOnly, setNegotiableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'price_low' | 'price_high'>('recent');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Queries
  const {
    data: listings = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['marketplace', 'listings'],
    queryFn: listMarketplaceListings,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['marketplace', 'categories'],
    queryFn: listMarketplaceCategories,
  });

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered & Sorted Listings
  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = (item.description ?? '').toLowerCase().includes(q);
          const matchLoc = (item.location ?? '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchLoc) return false;
        }
        // Category
        if (selectedCategory !== 'all') {
          if (
            item.category?.slug !== selectedCategory &&
            item.category?.name !== selectedCategory
          ) {
            return false;
          }
        }
        // Condition
        if (selectedCondition !== 'all') {
          if (item.condition?.toLowerCase() !== selectedCondition.toLowerCase()) return false;
        }
        // Under $50
        if (under50Only && item.price > 50) return false;
        // Negotiable
        if (negotiableOnly && !item.negotiable) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [
    listings,
    searchQuery,
    selectedCategory,
    selectedCondition,
    under50Only,
    negotiableOnly,
    sortBy,
  ]);

  // Fallback image helper
  const getItemImage = (item: MarketplaceListing) => {
    if (item.images && item.images.length > 0) return item.images[0].url;
    const t = item.title.toLowerCase();
    if (
      t.includes('mixer') ||
      t.includes('grinder') ||
      t.includes('pot') ||
      t.includes('cookware')
    ) {
      return 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80';
    }
    if (t.includes('cricket') || t.includes('bat') || t.includes('sports')) {
      return 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80';
    }
    if (t.includes('table') || t.includes('chair') || t.includes('furniture')) {
      return 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80';
    }
    if (t.includes('saree') || t.includes('silk') || t.includes('ethnic')) {
      return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
    }
    if (t.includes('speaker') || t.includes('gadget') || t.includes('electronics')) {
      return 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1605648916361-9bc12ad6a569?auto=format&fit=crop&w=800&q=80';
  };

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.scrollContent, isDesktop && s.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        {/* Trust & Community Banner */}
        <View style={s.trustBanner}>
          <View style={s.trustLeft}>
            <View style={s.shieldIcon}>
              <AppIcon name="shield" size={20} color={C.secondary} />
            </View>
            <View style={s.trustTextGroup}>
              <Text style={s.trustTitle}>Telugu & Desi Community Marketplace</Text>
              <Text style={s.trustSub}>
                0% Brokerage · Safe Neighborhood Pickups · Verified Desi Bandhus
              </Text>
            </View>
          </View>
          {!isCompact && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sell an Item"
              style={s.sellBannerBtn}
              onPress={() => router.push('/marketplace/sell')}
            >
              <AppIcon name="plus" size={16} color="#FFF" />
              <Text style={s.sellBannerBtnText}>Sell Item</Text>
            </Pressable>
          )}
        </View>

        {/* Search & Location Row */}
        <View style={s.searchBarContainer}>
          <View style={s.searchField}>
            <AppIcon name="search" size={20} color={C.inkMuted} />
            <TextInput
              style={s.searchInput}
              placeholder="Search furniture, cricket gear, sarees, cookware..."
              placeholderTextColor={C.inkMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Text style={s.closeIconText}>✕</Text>
              </Pressable>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter and Sort Options"
            style={s.filterTriggerBtn}
            onPress={() => setIsFilterModalOpen(true)}
          >
            <AppIcon name="wrench" size={18} color={C.secondary} />
            {isDesktop && <Text style={s.filterTriggerText}>Filters & Sort</Text>}
          </Pressable>
        </View>

        {/* Horizontally Scrollable Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.categoryBar}
        >
          <Pressable
            style={[s.categoryChip, selectedCategory === 'all' && s.categoryChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[s.categoryChipText, selectedCategory === 'all' && s.categoryChipTextActive]}
            >
              All Items ({listings.length})
            </Text>
          </Pressable>

          {categories.map((cat) => {
            const isActive = selectedCategory === cat.slug || selectedCategory === cat.name;
            return (
              <Pressable
                key={cat.id}
                style={[s.categoryChip, isActive && s.categoryChipActive]}
                onPress={() => setSelectedCategory(isActive ? 'all' : cat.slug)}
              >
                <Text style={[s.categoryChipText, isActive && s.categoryChipTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Secondary Quick Filter Pills */}
        <View style={s.quickPillRow}>
          <Pressable
            style={[s.quickPill, under50Only && s.quickPillActive]}
            onPress={() => setUnder50Only(!under50Only)}
          >
            <AppIcon name="wallet" size={14} color={under50Only ? '#FFF' : C.inkMuted} />
            <Text style={[s.quickPillText, under50Only && s.quickPillTextActive]}>Under $50</Text>
          </Pressable>

          <Pressable
            style={[s.quickPill, negotiableOnly && s.quickPillActive]}
            onPress={() => setNegotiableOnly(!negotiableOnly)}
          >
            <AppIcon name="wallet" size={14} color={negotiableOnly ? '#FFF' : C.inkMuted} />
            <Text style={[s.quickPillText, negotiableOnly && s.quickPillTextActive]}>
              Negotiable Deals
            </Text>
          </Pressable>

          <Pressable
            style={[s.quickPill, selectedCondition === 'Like New' && s.quickPillActive]}
            onPress={() =>
              setSelectedCondition(selectedCondition === 'Like New' ? 'all' : 'Like New')
            }
          >
            <AppIcon
              name="sparks"
              size={14}
              color={selectedCondition === 'Like New' ? '#FFF' : C.inkMuted}
            />
            <Text
              style={[s.quickPillText, selectedCondition === 'Like New' && s.quickPillTextActive]}
            >
              Like New
            </Text>
          </Pressable>

          <View style={s.sortSummary}>
            <Text style={s.sortSummaryText}>
              {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} found
            </Text>
          </View>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.loadingText}>Fetching community marketplace items...</Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && filteredListings.length === 0 && (
          <View style={s.emptyContainer}>
            <View style={s.emptyIconCircle}>
              <AppIcon name="package" size={40} color={C.secondary} />
            </View>
            <Text style={s.emptyTitle}>No items match your criteria</Text>
            <Text style={s.emptySub}>
              Try adjusting your category, price range, or search keywords.
            </Text>
            <Pressable
              style={s.resetBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedCondition('all');
                setUnder50Only(false);
                setNegotiableOnly(false);
              }}
            >
              <Text style={s.resetBtnText}>Reset All Filters</Text>
            </Pressable>
          </View>
        )}

        {/* Responsive Marketplace Product Grid */}
        <View style={[s.grid, isDesktop && s.gridDesktop]}>
          {filteredListings.map((item) => {
            const isSaved = savedIds.has(item.id);
            const imageUrl = getItemImage(item);

            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`View details for ${item.title}`}
                style={[s.itemCard, isCompact && s.itemCardCompact, isDesktop && s.itemCardDesktop]}
                onPress={() => router.push(`/marketplace/${item.id}` as any)}
              >
                {/* Image Container */}
                <View style={s.imageBox}>
                  <Image source={{ uri: imageUrl }} style={s.thumbnail} />

                  {/* Price Tag Overlay */}
                  <View style={s.priceTag}>
                    <Text style={s.priceText}>
                      {item.price === 0 ? 'FREE' : `$${Number(item.price).toFixed(0)}`}
                    </Text>
                  </View>

                  {/* Condition Badge */}
                  <View style={s.conditionTag}>
                    <Text style={s.conditionText}>{item.condition}</Text>
                  </View>

                  {/* Heart Save Button */}
                  <Pressable
                    style={s.heartBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleSave(item.id);
                    }}
                    hitSlop={10}
                  >
                    <Text style={[s.heartText, isSaved && s.heartTextSaved]}>
                      {isSaved ? '♥' : '♡'}
                    </Text>
                  </Pressable>
                </View>

                {/* Card Content */}
                <View style={s.cardBody}>
                  <Text style={s.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  {/* Location & Negotiable */}
                  <View style={s.locRow}>
                    <AppIcon name="map" size={13} color={C.inkMuted} />
                    <Text style={s.locText} numberOfLines={1}>
                      {item.location}
                    </Text>
                    {item.negotiable && (
                      <View style={s.negBadge}>
                        <Text style={s.negText}>Negotiable</Text>
                      </View>
                    )}
                  </View>

                  {/* Seller Trust Tag */}
                  <View style={s.sellerRow}>
                    <View style={s.verifiedDot}>
                      <AppIcon name="verified-user" size={14} color={C.secondary} />
                    </View>
                    <Text style={s.sellerText}>Verified Telugu Bandhu</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) on Mobile */}
      {!isDesktop && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post an item for sale"
          style={s.fab}
          onPress={() => router.push('/marketplace/sell')}
        >
          <AppIcon name="plus" size={18} color="#FFF" />
          <Text style={s.fabText}>Sell Item</Text>
        </Pressable>
      )}

      {/* Filter & Sort Bottom Sheet / Modal */}
      <Modal
        visible={isFilterModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={[s.modalBackdrop, !isDesktop && s.modalBackdropMobile]}>
          <View style={[s.modalContent, isDesktop && s.modalContentDesktop]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Filters & Sort</Text>
              <Pressable onPress={() => setIsFilterModalOpen(false)} hitSlop={10}>
                <Text style={s.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
              {/* Sort By Section */}
              <Text style={s.filterSectionTitle}>Sort Listings</Text>
              <View style={s.filterOptionRow}>
                <Pressable
                  style={[s.modalChip, sortBy === 'recent' && s.modalChipActive]}
                  onPress={() => setSortBy('recent')}
                >
                  <Text style={[s.modalChipText, sortBy === 'recent' && s.modalChipTextActive]}>
                    Most Recent
                  </Text>
                </Pressable>
                <Pressable
                  style={[s.modalChip, sortBy === 'price_low' && s.modalChipActive]}
                  onPress={() => setSortBy('price_low')}
                >
                  <Text style={[s.modalChipText, sortBy === 'price_low' && s.modalChipTextActive]}>
                    Price: Low to High
                  </Text>
                </Pressable>
                <Pressable
                  style={[s.modalChip, sortBy === 'price_high' && s.modalChipActive]}
                  onPress={() => setSortBy('price_high')}
                >
                  <Text style={[s.modalChipText, sortBy === 'price_high' && s.modalChipTextActive]}>
                    Price: High to Low
                  </Text>
                </Pressable>
              </View>

              {/* Condition Section */}
              <Text style={s.filterSectionTitle}>Item Condition</Text>
              <View style={s.filterOptionRow}>
                {['all', 'Brand New', 'Like New', 'Gently Used'].map((c) => (
                  <Pressable
                    key={c}
                    style={[s.modalChip, selectedCondition === c && s.modalChipActive]}
                    onPress={() => setSelectedCondition(c)}
                  >
                    <Text
                      style={[s.modalChipText, selectedCondition === c && s.modalChipTextActive]}
                    >
                      {c === 'all' ? 'Any Condition' : c}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Price Toggles */}
              <Text style={s.filterSectionTitle}>Special Preferences</Text>
              <Pressable style={s.toggleRow} onPress={() => setUnder50Only(!under50Only)}>
                <Text style={s.toggleLabel}>Items Under $50</Text>
                <View style={[s.checkbox, under50Only && s.checkboxChecked]}>
                  {under50Only && <AppIcon name="check" size={14} color="#FFF" />}
                </View>
              </Pressable>

              <Pressable style={s.toggleRow} onPress={() => setNegotiableOnly(!negotiableOnly)}>
                <Text style={s.toggleLabel}>Negotiable Deals Only</Text>
                <View style={[s.checkbox, negotiableOnly && s.checkboxChecked]}>
                  {negotiableOnly && <AppIcon name="check" size={14} color="#FFF" />}
                </View>
              </Pressable>
            </ScrollView>

            <View style={s.modalFooter}>
              <Pressable
                style={s.modalResetBtn}
                onPress={() => {
                  setSortBy('recent');
                  setSelectedCondition('all');
                  setUnder50Only(false);
                  setNegotiableOnly(false);
                }}
              >
                <Text style={s.modalResetText}>Reset</Text>
              </Pressable>
              <Pressable style={s.modalApplyBtn} onPress={() => setIsFilterModalOpen(false)}>
                <Text style={s.modalApplyText}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export const MarketplaceScreen = MarketplaceHomeScreen;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
  },
  scrollContentDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5EFE6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  trustLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTextGroup: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.secondary,
  },
  trustSub: {
    fontSize: 12,
    color: C.inkMuted,
    marginTop: 2,
  },
  sellBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginLeft: 12,
  },
  sellBannerBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBarContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.ink,
    height: '100%',
  },
  closeIconText: {
    fontSize: 14,
    color: C.inkMuted,
    fontWeight: '700',
  },
  filterTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  filterTriggerText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.secondary,
  },
  categoryBar: {
    gap: 8,
    paddingBottom: 12,
  },
  categoryChip: {
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.ink,
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  quickPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickPillActive: {
    backgroundColor: C.secondary,
    borderColor: C.secondary,
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.ink,
  },
  quickPillTextActive: {
    color: '#FFF',
  },
  sortSummary: {
    marginLeft: 'auto',
  },
  sortSummaryText: {
    fontSize: 12,
    color: C.inkMuted,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: C.inkMuted,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: C.inkMuted,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  resetBtn: {
    backgroundColor: C.secondary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  gridDesktop: {
    gap: 18,
  },
  itemCard: {
    width: '47.5%',
    backgroundColor: C.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#2B3338',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  itemCardCompact: {
    width: '100%',
  },
  itemCardDesktop: {
    width: '23.5%',
  },
  imageBox: {
    width: '100%',
    height: 145,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  priceTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: C.emerald,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priceText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  conditionTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(21, 29, 33, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  conditionText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: {
    fontSize: 16,
    color: '#FFF',
  },
  heartTextSaved: {
    color: '#EF4444',
  },
  cardBody: {
    padding: 10,
    gap: 6,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
    lineHeight: 18,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locText: {
    fontSize: 11,
    color: C.inkMuted,
    flex: 1,
  },
  negBadge: {
    backgroundColor: C.goldBg,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  negText: {
    fontSize: 9,
    fontWeight: '700',
    color: C.goldText,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  verifiedDot: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.secondary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 999,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdropMobile: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.bg,
    width: '100%',
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalContentDesktop: {
    maxWidth: 500,
    borderRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.ink,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: C.ink,
  },
  modalBody: {
    paddingVertical: 14,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
    marginTop: 12,
    marginBottom: 8,
  },
  filterOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalChip: {
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalChipActive: {
    backgroundColor: C.secondary,
    borderColor: C.secondary,
  },
  modalChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.ink,
  },
  modalChipTextActive: {
    color: '#FFF',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  toggleLabel: {
    fontSize: 14,
    color: C.ink,
    fontWeight: '500',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.inkMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: C.secondary,
    borderColor: C.secondary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  modalResetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  modalResetText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.ink,
  },
  modalApplyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: 'center',
  },
  modalApplyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
