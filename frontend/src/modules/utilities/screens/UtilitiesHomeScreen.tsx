import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getUtilitiesHome } from '@/modules/utilities/api';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';

const C = {
  primary: '#431ebe',
  primaryMuted: '#ece8ff',
  teal: '#00696b',
  tealMuted: '#e0f5f5',
  accent: '#ff7e33',
  accentMuted: '#fff0e8',
  emerald: '#16a34a',
  emeraldMuted: '#dcfce7',
  bg: '#faf8ff',
  cardBg: '#ffffff',
  border: '#e8e5f2',
  ink: '#1b1829',
  inkMuted: '#6b6882',
};

interface ServiceItem {
  id: string;
  category: string;
  title: string;
  provider: string;
  description: string;
  rating: number;
  reviewCount: number;
  badge?: string;
  price?: string;
  phone?: string;
  location: string;
}

const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'tiffin-1',
    category: 'Tiffin & Dabba',
    title: 'Annapurna Homestyle Tiffin',
    provider: 'Lakshmi Rao (Round Rock)',
    description: 'Fresh rotis, South Indian dal, seasonal sabzi, sambar & curd rice. Delivered daily Mon-Fri.',
    rating: 4.9,
    reviewCount: 78,
    badge: 'Popular',
    price: '$190/mo',
    phone: '+1 (512) 555-0192',
    location: 'North Austin & Round Rock',
  },
  {
    id: 'grocery-1',
    category: 'Groceries',
    title: 'Weekend Patel Brothers Shared Run',
    provider: 'Austin Telugu Student Group',
    description: 'Carpool & shared grocery pickup for bulky items (Atta bags, Sona Masoori rice, fresh spices).',
    rating: 4.8,
    reviewCount: 42,
    badge: 'Departs Sat 10 AM',
    price: 'Free Carpool',
    location: 'West Campus to Subzi Mandi',
  },
  {
    id: 'fiber-1',
    category: 'Electricity & Wifi',
    title: 'Texas Power to Choose & AT&T Fiber',
    provider: 'ManaBandhu Utility Concierge',
    description: 'Compare 12-month fixed rate electricity contracts (Gexa, TXU) + gigabit student fiber waiver.',
    rating: 4.7,
    reviewCount: 35,
    badge: 'Save ~$45/mo',
    price: 'Free Advisory',
    location: 'Austin Metro & DFW',
  },
  {
    id: 'temple-1',
    category: 'Puja & Temples',
    title: 'Austin Hindu Temple & Balaji Puja',
    provider: 'AHT Priest Services',
    description: 'Griha Pravesham, Satyanarayana Vratam, vehicle blessings & temple festival schedule.',
    rating: 5.0,
    reviewCount: 110,
    badge: 'Verified',
    price: 'Donation',
    location: '9801 Decker Lake Rd, Austin',
  },
  {
    id: 'courier-1',
    category: 'Luggage & Courier',
    title: 'India Check-In Baggage Share',
    provider: 'Verified Community Travelers',
    description: 'Share unutilized 23kg check-in allowance for non-commercial sweets, documents & apparel to HYD/BLR.',
    rating: 4.8,
    reviewCount: 29,
    badge: 'ID Verified',
    price: '$15/kg',
    location: 'Austin (AUS) -> Hyderabad (HYD)',
  },
];

const CATEGORIES = ['All Services', 'Tiffin & Dabba', 'Groceries', 'Electricity & Wifi', 'Puja & Temples', 'Luggage & Courier'];

export function UtilitiesHomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activeCategory, setActiveCategory] = useState('All Services');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const home = useQuery({ queryKey: ['utilities', 'home'], queryFn: getUtilitiesHome, retry: false });

  if (home.isLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <LoadingState label="Loading utilities and diaspora services..." />
        </View>
      </SafeAreaView>
    );
  }

  const filtered = SERVICES_DATA.filter((item) => {
    const matchesCat = activeCategory === 'All Services' || item.category === activeCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={[s.content, isDesktop && s.contentDesktop]}>
        {/* Header */}
        <View style={s.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={s.backBtn}
          >
            <AppIcon name="chevron-left" size={20} color={C.ink} />
          </Pressable>
          <View style={s.headerTextCol}>
            <View style={s.locationTag}>
              <AppIcon name="map" size={12} color={C.teal} />
              <Text style={s.locationText}>Austin & DFW Metro, TX</Text>
            </View>
            <Text style={s.headerTitle}>Utilities & Diaspora Hub</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={s.searchBar}>
          <AppIcon name="search" size={18} color={C.inkMuted} />
          <TextInput
            placeholder="Search tiffin, grocery runs, wifi, pujas..."
            placeholderTextColor={C.inkMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={s.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={{ fontSize: 16, color: C.inkMuted, fontWeight: '700' }}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Quick Nav Shortcut Actions */}
        <View style={s.quickActionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Packages"
            onPress={() => router.push('/utilities/packages' as any)}
            style={s.quickActionCard}
          >
            <View style={[s.actionIconBox, { backgroundColor: C.primaryMuted }]}>
              <AppIcon name="package" size={20} color={C.primary} />
            </View>
            <Text style={s.actionLabel}>Packages</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nearby"
            onPress={() => router.push('/utilities/nearby' as any)}
            style={s.quickActionCard}
          >
            <View style={[s.actionIconBox, { backgroundColor: C.tealMuted }]}>
              <AppIcon name="map" size={20} color={C.teal} />
            </View>
            <Text style={s.actionLabel}>Nearby Map</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Emergency"
            onPress={() => router.push('/utilities/emergency' as any)}
            style={s.quickActionCard}
          >
            <View style={[s.actionIconBox, { backgroundColor: C.accentMuted }]}>
              <AppIcon name="warning" size={20} color={C.accent} />
            </View>
            <Text style={s.actionLabel}>Emergency</Text>
          </Pressable>
        </View>

        {/* Featured Community Banner */}
        <View style={s.featuredBanner}>
          <View style={s.featuredBadge}>
            <Text style={s.featuredBadgeText}>COMMUNITY SPOTLIGHT</Text>
          </View>
          <Text style={s.featuredTitle}>Moving to Texas this Fall?</Text>
          <Text style={s.featuredDesc}>
            Setup your electricity with student deposit waivers, compare gigabit fiber providers, and order daily Telugu tiffins in minutes.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View Move-in Guide"
            onPress={() => router.push('/utilities/packages' as any)}
            style={s.featuredBtn}
          >
            <Text style={s.featuredBtnText}>Explore Move-In Bundles</Text>
            <AppIcon name="chevron-right" size={16} color="#ffffff" />
          </Pressable>
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoriesScroll} contentContainerStyle={s.categoriesContent}>
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <Pressable
                key={cat}
                accessibilityRole="button"
                accessibilityLabel={cat}
                onPress={() => setActiveCategory(cat)}
                style={[s.categoryPill, active && s.categoryPillActive]}
              >
                <Text style={[s.categoryPillText, active && s.categoryPillTextActive]}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Services List */}
        <View style={s.servicesList}>
          {filtered.length === 0 ? (
            <View style={s.emptyBox}>
              <AppIcon name="search" size={32} color={C.inkMuted} />
              <Text style={s.emptyTitle}>No services found</Text>
              <Text style={s.emptySubtitle}>Try adjusting your search terms or category filter.</Text>
            </View>
          ) : (
            filtered.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                onPress={() => setSelectedService(item)}
                style={s.serviceCard}
              >
                <View style={s.cardHeader}>
                  <View style={s.cardHeaderLeft}>
                    <Text style={s.categoryLabel}>{item.category.toUpperCase()}</Text>
                    <Text style={s.serviceTitle}>{item.title}</Text>
                    <Text style={s.providerName}>By {item.provider}</Text>
                  </View>
                  {item.badge && (
                    <View style={s.badgePill}>
                      <Text style={s.badgePillText}>{item.badge}</Text>
                    </View>
                  )}
                </View>

                <Text style={s.serviceDesc} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={s.cardFooter}>
                  <View style={s.ratingRow}>
                    <AppIcon name="star" size={14} color="#f59e0b" />
                    <Text style={s.ratingText}>
                      {item.rating.toFixed(1)} <Text style={s.reviewCount}>({item.reviewCount})</Text>
                    </Text>
                    <Text style={s.locationDot}>·</Text>
                    <Text style={s.locationSmall} numberOfLines={1}>{item.location}</Text>
                  </View>
                  {item.price && <Text style={s.priceTag}>{item.price}</Text>}
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Service Detail Modal */}
      {selectedService && (
        <Modal visible transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              <View style={s.modalHandle} />
              <View style={s.modalTop}>
                <View style={s.badgePill}>
                  <Text style={s.badgePillText}>{selectedService.category}</Text>
                </View>
                <Pressable onPress={() => setSelectedService(null)} style={s.closeBtn}>
                  <Text style={{ fontSize: 18, color: C.ink, fontWeight: '700' }}>✕</Text>
                </Pressable>
              </View>

              <Text style={s.modalTitle}>{selectedService.title}</Text>
              <Text style={s.modalProvider}>Offered by {selectedService.provider}</Text>

              <View style={s.modalDetailsRow}>
                <View style={s.detailCol}>
                  <Text style={s.detailLabel}>RATING</Text>
                  <Text style={s.detailVal}>★ {selectedService.rating.toFixed(1)} ({selectedService.reviewCount})</Text>
                </View>
                <View style={s.detailCol}>
                  <Text style={s.detailLabel}>PRICE / FEE</Text>
                  <Text style={[s.detailVal, { color: C.teal }]}>{selectedService.price ?? 'Free'}</Text>
                </View>
                <View style={s.detailCol}>
                  <Text style={s.detailLabel}>SERVICE AREA</Text>
                  <Text style={s.detailVal} numberOfLines={1}>{selectedService.location}</Text>
                </View>
              </View>

              <Text style={s.sectionSubtitle}>Overview & Inclusions</Text>
              <Text style={s.modalDesc}>{selectedService.description}</Text>

              <View style={s.modalActionRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Contact Provider"
                  onPress={() => {
                    Alert.alert('Contact Request Sent', `The provider for ${selectedService.title} has been notified. They will message you via ManaBandhu Chat!`);
                    setSelectedService(null);
                  }}
                  style={s.contactBtn}
                >
                  <AppIcon name="message" size={18} color="#ffffff" />
                  <Text style={s.contactBtnText}>Message Provider</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save Service"
                  onPress={() => {
                    Alert.alert('Saved', `${selectedService.title} has been saved to your diaspora essentials.`);
                    setSelectedService(null);
                  }}
                  style={s.saveBtn}
                >
                  <AppIcon name="star" size={18} color={C.primary} />
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  contentDesktop: {
    padding: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.ink,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.ink,
    padding: 0,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: C.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.ink,
  },
  featuredBanner: {
    backgroundColor: C.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  featuredBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  featuredDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
    marginBottom: 14,
  },
  featuredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  featuredBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContent: {
    gap: 8,
    paddingRight: 16,
  },
  categoryPill: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  categoryPillActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.inkMuted,
  },
  categoryPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: C.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.teal,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.ink,
    marginBottom: 2,
  },
  providerName: {
    fontSize: 12,
    color: C.inkMuted,
  },
  badgePill: {
    backgroundColor: C.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePillText: {
    color: C.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  serviceDesc: {
    fontSize: 13,
    color: C.inkMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.ink,
  },
  reviewCount: {
    color: C.inkMuted,
    fontWeight: '500',
  },
  locationDot: {
    color: C.inkMuted,
    marginHorizontal: 2,
  },
  locationSmall: {
    fontSize: 11,
    color: C.inkMuted,
    flexShrink: 1,
  },
  priceTag: {
    fontSize: 13,
    fontWeight: '800',
    color: C.teal,
  },
  emptyBox: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: C.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.inkMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.ink,
    marginBottom: 2,
  },
  modalProvider: {
    fontSize: 13,
    color: C.inkMuted,
    marginBottom: 16,
  },
  modalDetailsRow: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  detailCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.inkMuted,
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: C.ink,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 13,
    color: C.inkMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  contactBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.cardBg,
  },
});
