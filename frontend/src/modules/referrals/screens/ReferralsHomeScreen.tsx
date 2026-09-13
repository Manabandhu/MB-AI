import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listPublicReferrals, type Referral } from '@/modules/referrals/api';
import { referralsScreenFallbacks } from '@/modules/referrals/referralsFallbacks';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

type TabType = 'offers' | 'requests';

const FILTER_CHIPS = [
  { id: 'all', label: 'All Referrals', icon: 'compass' },
  { id: 'jobs', label: 'Job Referrals', icon: 'briefcase' },
  { id: 'legal', label: 'Immigration Legal', icon: 'shield' },
  { id: 'skills', label: 'Skill Swap', icon: 'sparks' },
  { id: 'housing', label: 'Housing Help', icon: 'home' },
] as const;

export function ReferralsScreen({ screenId }: { screenId?: string }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activeTab, setActiveTab] = useState<TabType>('offers');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const { data: rawReferrals, isLoading, refetch } = useQuery({
    queryKey: ['referrals', 'public'],
    queryFn: listPublicReferrals,
  });

  // Fallback demo items if backend query is empty or loading
  const fallbackOffers: Referral[] = [
    {
      id: 'e1111111-1111-1111-1111-111111111111',
      ownerId: 'demo-user-1',
      recipientId: 'demo-user-2',
      type: 'offer',
      status: 'active',
      title: 'Staff Software Engineer @ Google (Cloud & Infra)',
      description: 'Happy to provide internal referrals for SWE L4-L6 roles in Sunnyvale, Austin, NYC, and Kirkland. Free resume review and interview tips included.',
      category: 'Tech Referral',
      contactInfo: 'phani.teja@google.com',
      createdAt: '2026-09-12T10:00:00Z',
      updatedAt: '2026-09-12T10:00:00Z',
    },
    {
      id: 'e2222222-2222-2222-2222-222222222222',
      ownerId: 'demo-user-2',
      recipientId: 'demo-user-1',
      type: 'offer',
      status: 'active',
      title: 'Principal Product Manager @ Microsoft Azure',
      description: 'Referring senior PMs, Technical PMs, and Group Engineering Managers for Azure Core, AI Copilot, and Cloud Security in Redmond and Austin.',
      category: 'Product Management',
      contactInfo: 'sunitha.reddy@microsoft.com',
      createdAt: '2026-09-11T14:00:00Z',
      updatedAt: '2026-09-11T14:00:00Z',
    },
    {
      id: 'e3333333-3333-3333-3333-333333333333',
      ownerId: 'demo-user-3',
      recipientId: 'demo-user-1',
      type: 'offer',
      status: 'active',
      title: 'Senior Data Scientist @ Amazon Ads / AWS',
      description: 'Internal referrals for Applied Science, ML Engineering, and Business Intelligence roles in Austin and Seattle.',
      category: 'AI / ML Data Science',
      contactInfo: 'kiran.varma@amazon.com',
      createdAt: '2026-09-10T11:00:00Z',
      updatedAt: '2026-09-10T11:00:00Z',
    },
    {
      id: 'e4444444-4444-4444-4444-444444444444',
      ownerId: 'demo-user-1',
      recipientId: 'demo-user-3',
      type: 'offer',
      status: 'active',
      title: 'Staff iOS Engineer @ Apple (Cupertino / Austin)',
      description: 'Can submit direct referrals for iOS/macOS applications, Swift foundation, and multimedia frameworks.',
      category: 'Mobile Development',
      contactInfo: 'vikram.rao@apple.com',
      createdAt: '2026-09-09T09:00:00Z',
      updatedAt: '2026-09-09T09:00:00Z',
    },
  ];

  const fallbackRequests: Referral[] = [
    {
      id: 'e5555555-5555-5555-5555-555555555555',
      ownerId: 'demo-user-2',
      recipientId: 'demo-user-1',
      type: 'request',
      status: 'pending',
      title: 'Seeking Referral for Senior DevOps / Platform Engineer at Meta',
      description: 'Kubernetes, Terraform, AWS certified engineer with 6 years experience looking for a referral for Meta Infra team in Austin or Remote.',
      category: 'Cloud Infrastructure',
      createdAt: '2026-09-12T16:00:00Z',
      updatedAt: '2026-09-12T16:00:00Z',
    },
    {
      id: 'e6666666-6666-6666-6666-666666666666',
      ownerId: 'demo-user-3',
      recipientId: 'demo-user-2',
      type: 'request',
      status: 'pending',
      title: 'Need recommendation for Immigration Attorney for EB-2 NIW',
      description: 'Looking for personal recommendations for trusted immigration attorneys in Dallas or Austin specializing in EB2 NIW petitions for Telugu professionals.',
      category: 'Immigration Legal',
      createdAt: '2026-09-12T18:00:00Z',
      updatedAt: '2026-09-12T18:00:00Z',
    },
  ];

  const allReferrals = (rawReferrals && rawReferrals.length > 0) ? rawReferrals : [...fallbackOffers, ...fallbackRequests];

  const offers = useMemo(() => allReferrals.filter((r) => r.type === 'offer'), [allReferrals]);
  const requests = useMemo(() => allReferrals.filter((r) => r.type === 'request'), [allReferrals]);

  const displayedItems = useMemo(() => {
    const list = activeTab === 'offers' ? offers : requests;
    return list.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesFilter = true;
      if (selectedFilter === 'jobs') {
        matchesFilter = item.title.toLowerCase().includes('engineer') || item.title.toLowerCase().includes('manager') || item.title.toLowerCase().includes('scientist') || (item.category?.toLowerCase().includes('tech') ?? false);
      } else if (selectedFilter === 'legal') {
        matchesFilter = item.title.toLowerCase().includes('attorney') || item.title.toLowerCase().includes('eb-2') || item.description.toLowerCase().includes('immigration');
      } else if (selectedFilter === 'skills') {
        matchesFilter = item.title.toLowerCase().includes('skill') || item.description.toLowerCase().includes('review');
      } else if (selectedFilter === 'housing') {
        matchesFilter = item.title.toLowerCase().includes('housing') || item.description.toLowerCase().includes('room');
      }

      return matchesSearch && matchesFilter;
    });
  }, [activeTab, offers, requests, searchQuery, selectedFilter]);

  function getCompanyInitials(title: string): { letter: string; color: string; bg: string } {
    const lower = title.toLowerCase();
    if (lower.includes('google')) return { letter: 'G', color: '#2563EB', bg: '#EFF6FF' };
    if (lower.includes('microsoft')) return { letter: 'M', color: '#0284C7', bg: '#F0F9FF' };
    if (lower.includes('amazon')) return { letter: 'A', color: '#D97706', bg: '#FFFBEB' };
    if (lower.includes('apple')) return { letter: '', color: '#1E1B4B', bg: '#F8FAFC' };
    if (lower.includes('meta')) return { letter: 'M', color: '#0866FF', bg: '#EFF6FF' };
    return { letter: title.charAt(0).toUpperCase() || 'R', color: colors.primary, bg: '#EEF2FF' };
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Sticky Top Header Area */}
      <View style={styles.headerArea}>
        <View style={styles.topRow}>
          <View style={styles.topRowLeft}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => router.back()}
              style={styles.iconCircle}
            >
              <AppIcon name="chevron-left" size={20} color={colors.ink} />
            </Pressable>
            <View>
              <View style={styles.eyebrowRow}>
                <View style={styles.teluguPill}>
                  <Text style={styles.teluguPillText}>మనోబంధు</Text>
                </View>
                <View style={styles.freePill}>
                  <View style={styles.greenDot} />
                  <Text style={styles.freePillText}>100% Free</Text>
                </View>
              </View>
              <Text style={styles.headerTitle}>Referrals & Skill Exchange</Text>
            </View>
          </View>

          <View style={styles.topRowRight}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="My Referrals"
              onPress={() => router.push('/referrals/mine')}
              style={styles.iconCircle}
            >
              <AppIcon name="user" size={18} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <AppIcon name="search" size={18} color={colors.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search companies (Google, Meta...), skills, or roles..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.muted }}>✕</Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter Options"
            onPress={() => setShowFilterModal(true)}
            style={styles.tuneButton}
          >
            <AppIcon name="wrench" size={18} color={colors.ink} />
          </Pressable>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          {FILTER_CHIPS.map((chip) => {
            const isSelected = selectedFilter === chip.id;
            return (
              <Pressable
                key={chip.id}
                onPress={() => setSelectedFilter(chip.id)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                <AppIcon
                  name={chip.icon}
                  size={14}
                  color={isSelected ? '#FFFFFF' : '#475569'}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          isDesktop && styles.scrollContainerDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isDesktop && styles.mainWrapperDesktop]}>
          {/* Hero Card: Verified Desi Referral Network */}
          <View style={styles.heroCard}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroVerifiedPill}>
                <AppIcon name="verified-user" size={13} color="#FDE047" />
                <Text style={styles.heroVerifiedText}>Verified Desi Referral Network</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>
              Connect & Grow with Bandhus in Tech & Beyond
            </Text>
            <Text style={styles.heroDescription}>
              Connect directly with Telugu & Indian professionals for company referrals, mock interviews, and trusted introductions. Zero brokerages, 100% community goodwill.
            </Text>

            <View style={styles.heroActionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Offer a Referral"
                onPress={() => router.push('/referrals/offer')}
                style={styles.heroPrimaryBtn}
              >
                <AppIcon name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.heroPrimaryBtnText}>Offer a Referral</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Request Referral"
                onPress={() => router.push('/referrals/request')}
                style={styles.heroSecondaryBtn}
              >
                <AppIcon name="mail" size={16} color="#FFFFFF" />
                <Text style={styles.heroSecondaryBtnText}>Request Referral</Text>
              </Pressable>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#1E1B4B' }]}>142+</Text>
              <Text style={styles.statLabel}>Companies</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#EA580C' }]}>520+</Text>
              <Text style={styles.statLabel}>Active Referrers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>94%</Text>
              <Text style={styles.statLabel}>Response Rate</Text>
            </View>
          </View>

          {/* Segmented Control Tabs */}
          <View style={styles.segmentedControl}>
            <Pressable
              onPress={() => setActiveTab('offers')}
              style={[
                styles.segmentBtn,
                activeTab === 'offers' && styles.segmentBtnActive,
              ]}
            >
              <AppIcon
                name="star"
                size={14}
                color={activeTab === 'offers' ? '#1E1B4B' : '#64748B'}
              />
              <Text
                style={[
                  styles.segmentBtnText,
                  activeTab === 'offers' && styles.segmentBtnTextActive,
                ]}
              >
                Available Offers
              </Text>
              <View
                style={[
                  styles.countBadge,
                  activeTab === 'offers' ? styles.countBadgeActive : styles.countBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    activeTab === 'offers' && styles.countBadgeTextActive,
                  ]}
                >
                  {offers.length}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('requests')}
              style={[
                styles.segmentBtn,
                activeTab === 'requests' && styles.segmentBtnActive,
              ]}
            >
              <AppIcon
                name="community"
                size={14}
                color={activeTab === 'requests' ? '#1E1B4B' : '#64748B'}
              />
              <Text
                style={[
                  styles.segmentBtnText,
                  activeTab === 'requests' && styles.segmentBtnTextActive,
                ]}
              >
                Community Requests
              </Text>
              <View
                style={[
                  styles.countBadge,
                  activeTab === 'requests' ? styles.countBadgeActive : styles.countBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    activeTab === 'requests' && styles.countBadgeTextActive,
                  ]}
                >
                  {requests.length}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Subheader with Trust Assurance */}
          <View style={styles.subHeaderRow}>
            <View>
              <Text style={styles.subHeaderTitle}>
                {activeTab === 'offers' ? 'Verified Professional Offers' : 'Active Community Requests'}
              </Text>
              <Text style={styles.subHeaderDesc}>
                {activeTab === 'offers' ? 'Direct response from verified company employees' : 'Bandhus seeking referrals, guidance & legal recommendations'}
              </Text>
            </View>
            <View style={styles.verifiedTag}>
              <AppIcon name="shield" size={12} color="#10B981" />
              <Text style={styles.verifiedTagText}>Work Verified</Text>
            </View>
          </View>

          {/* Items Feed */}
          {displayedItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AppIcon name="briefcase" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No referrals found</Text>
              <Text style={styles.emptyDesc}>
                Try adjusting your search query or switching to another category.
              </Text>
              <Pressable
                onPress={() => { setSearchQuery(''); setSelectedFilter('all'); }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>Clear filters</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.cardsList}>
              {displayedItems.map((item) => {
                const company = getCompanyInitials(item.title);
                return (
                  <View key={item.id} style={styles.card}>
                    {/* Top Row: Avatar/Icon + Title & Author */}
                    <View style={styles.cardHeader}>
                      <View style={[styles.companyAvatar, { backgroundColor: company.bg }]}>
                        <Text style={[styles.companyAvatarText, { color: company.color }]}>
                          {company.letter}
                        </Text>
                      </View>
                      <View style={styles.cardHeaderInfo}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <View style={styles.cardMetaRow}>
                          <Text style={styles.cardAuthorText}>
                            {activeTab === 'offers' ? 'Offered by' : 'Requested by'}{' '}
                            <Text style={styles.cardAuthorBold}>
                              {activeTab === 'offers' ? 'Verified Bandhu' : 'Community Member'}
                            </Text>
                          </Text>
                          <AppIcon name="verified-user" size={13} color="#10B981" />
                        </View>
                      </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.cardDesc} numberOfLines={3}>
                      {item.description}
                    </Text>

                    {/* Badges / Tags */}
                    <View style={styles.tagsRow}>
                      {item.category ? (
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillText}>{item.category}</Text>
                        </View>
                      ) : null}
                      <View style={[styles.tagPill, { backgroundColor: '#F0FDF4' }]}>
                        <Text style={[styles.tagPillText, { color: '#15803D' }]}>
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.tagPill, { backgroundColor: '#F8FAFC' }]}>
                        <Text style={[styles.tagPillText, { color: '#64748B' }]}>
                          100% Free
                        </Text>
                      </View>
                    </View>

                    {/* Card Action Row */}
                    <View style={styles.cardActionRow}>
                      <Text style={styles.postedTime}>
                        Active referral exchange
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="View Referral Details"
                        onPress={() => router.push(`/referrals/${item.id}`)}
                        style={styles.cardActionBtn}
                      >
                        <Text style={styles.cardActionBtnText}>
                          {activeTab === 'offers' ? 'Ask for Referral' : 'Help Bandhu'}
                        </Text>
                        <AppIcon name="chevron-right" size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (Mobile) */}
      {!isDesktop ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post New Referral"
          onPress={() => router.push('/referrals/offer')}
          style={styles.fabButton}
        >
          <AppIcon name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.fabText}>Offer Referral</Text>
        </Pressable>
      ) : null}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
          <Pressable style={[styles.modalCard, isDesktop && styles.modalCardDesktop]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Referrals</Text>
              <Pressable onPress={() => setShowFilterModal(false)}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.modalSubheading}>Category & Domain</Text>
            <View style={styles.modalOptions}>
              {FILTER_CHIPS.map((chip) => {
                const isSelected = selectedFilter === chip.id;
                return (
                  <Pressable
                    key={chip.id}
                    onPress={() => { setSelectedFilter(chip.id); setShowFilterModal(false); }}
                    style={[styles.modalOptionBtn, isSelected && styles.modalOptionBtnActive]}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setShowFilterModal(false)}
              style={styles.modalDoneBtn}
            >
              <Text style={styles.modalDoneBtnText}>Apply Filter</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerArea: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: space.x2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
    paddingBottom: space.x2,
  },
  topRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
  },
  teluguPill: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingHorizontal: space.x2,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  teluguPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  freePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  freePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
    marginTop: 2,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.x4,
    gap: space.x2,
    paddingBottom: space.x2,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.control,
    paddingHorizontal: space.x3,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: space.x2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E1B4B',
    fontWeight: '500',
  },
  tuneButton: {
    width: 42,
    height: 42,
    borderRadius: radius.control,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipsRow: {
    paddingHorizontal: space.x4,
    paddingBottom: space.x3,
    gap: space.x2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  filterChipActive: {
    backgroundColor: '#1E1B4B',
    borderColor: '#1E1B4B',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContainer: {
    paddingHorizontal: space.x4,
    paddingTop: space.x3,
    paddingBottom: 80,
  },
  scrollContainerDesktop: {
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
    gap: space.x4,
  },
  mainWrapperDesktop: {
    maxWidth: 720,
  },
  heroCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: radius.card,
    padding: space.x4,
    gap: space.x3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroBadgeRow: {
    flexDirection: 'row',
  },
  heroVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  heroVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE047',
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  heroDescription: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: space.x2,
    marginTop: space.x1,
  },
  heroPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EA580C',
    paddingVertical: 10,
    borderRadius: radius.control,
  },
  heroPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 10,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: space.x2,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: space.x3,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: radius.control,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#1E1B4B',
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(30,27,75,0.08)',
  },
  countBadgeInactive: {
    backgroundColor: '#CBD5E1',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  countBadgeTextActive: {
    color: '#1E1B4B',
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.x1,
  },
  subHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  subHeaderDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  cardsList: {
    gap: space.x3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: space.x4,
    gap: space.x3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.x3,
  },
  companyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  companyAvatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B4B',
    lineHeight: 18,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  cardAuthorText: {
    fontSize: 11,
    color: '#64748B',
  },
  cardAuthorBold: {
    fontWeight: '700',
    color: '#1E1B4B',
  },
  cardDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4338CA',
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.x2,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  postedTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  cardActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.x8,
    gap: space.x2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },
  clearBtn: {
    marginTop: space.x2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E1B4B',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.pill,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.x4,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    padding: space.x5,
    gap: space.x3,
  },
  modalCardDesktop: {
    maxWidth: 460,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  modalSubheading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  modalOptions: {
    gap: space.x2,
  },
  modalOptionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalOptionBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  modalOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalOptionTextActive: {
    color: '#4338CA',
    fontWeight: '700',
  },
  modalDoneBtn: {
    backgroundColor: '#1E1B4B',
    paddingVertical: 12,
    borderRadius: radius.control,
    alignItems: 'center',
    marginTop: space.x2,
  },
  modalDoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
