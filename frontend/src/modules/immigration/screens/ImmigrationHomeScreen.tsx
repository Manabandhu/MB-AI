import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getImmigrationScreen } from '@/modules/immigration/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { useAdaptiveLayout } from '@/platform/adaptive';

import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

type ImmigrationScreenProps = {
  screenId: keyof typeof immigrationRoutes;
};

type ImmigrationTab = 'all' | 'h1b' | 'opt' | 'greencard' | 'parents';

export function ImmigrationScreen({ screenId }: ImmigrationScreenProps) {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const [activeTab, setActiveTab] = useState<ImmigrationTab>('all');
  const [savedGuides, setSavedGuides] = useState<Set<string>>(new Set(['guide-parents']));

  const screen = useQuery({
    queryKey: ['immigration', 'screen', screenId],
    queryFn: () => getImmigrationScreen(screenId),
    retry: false,
  });

  if (screen.isLoading) {
    return <LoadingState label="Loading immigration resources..." />;
  }

  // If viewing a sub-screen, use FeatureScreen
  if (screenId !== 'home') {
    const data = screen.data ?? DEFAULT_IMMIGRATION_DATA[screenId] ?? DEFAULT_IMMIGRATION_DATA.home;
    return (
      <FeatureScreen
        actions={immigrationActions[screenId]}
        cards={data.items}
        currentRoute={immigrationRoutes[screenId]}
        eyebrow={data.eyebrow}
        metrics={data.metrics}
        subtitle={data.subtitle}
        title={data.title}
      />
    );
  }

  const toggleSave = (id: string) => {
    setSavedGuides((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        Alert.alert('Bookmark Removed', 'Article removed from your saved items.');
      } else {
        next.add(id);
        Alert.alert('Bookmark Saved', 'Article saved for offline reference.');
      }
      return next;
    });
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={[s.container, { maxWidth: layout.maxContentWidth }]}>
          {/* Header */}
          <View style={s.headerRow}>
            <View style={s.headerLeft}>
              <View style={s.badgePill}>
                <Text style={s.badgePillText}>IMMIGRATION & VISA HUB • LIVE SYNC</Text>
              </View>
              <Text style={s.headerTitle}>Visa Guidance & Bulletin</Text>
              <Text style={s.headerSubtitle}>
                Community-verified guides, real-time priority date movement & vetted attorneys.
              </Text>
            </View>
            <Pressable
              style={s.searchIconBtn}
              onPress={() => router.push('/immigration/resources')}
              accessibilityRole="button"
              accessibilityLabel="Browse resources"
            >
              <AppIcon name="search" size={20} color="#431ebe" />
            </Pressable>
          </View>

          {/* Visa Bulletin Hero Card */}
          <View style={s.bulletinCard}>
            <View style={s.bulletinHeader}>
              <View style={s.bulletinTag}>
                <Text style={s.bulletinTagText}>USCIS VISA BULLETIN • OCT 2026</Text>
              </View>
              <Text style={s.bulletinSyncText}>Synced with Travel.State.Gov</Text>
            </View>

            <Text style={s.bulletinHeroTitle}>India Priority Date Movement</Text>

            {/* Movement Tickers */}
            <View style={s.tickerGrid}>
              <View style={s.tickerCol}>
                <Text style={s.tickerCategory}>EB-2 INDIA</Text>
                <Text style={s.tickerDate}>15 JUL 2013</Text>
                <View style={s.movementRow}>
                  <Text style={s.movementGreen}>▲ +2 Months</Text>
                </View>
              </View>

              <View style={s.tickerDivider} />

              <View style={s.tickerCol}>
                <Text style={s.tickerCategory}>EB-3 INDIA</Text>
                <Text style={s.tickerDate}>01 NOV 2012</Text>
                <View style={s.movementRow}>
                  <Text style={s.movementGreen}>▲ +1.5 Months</Text>
                </View>
              </View>

              <View style={s.tickerDivider} />

              <View style={s.tickerCol}>
                <Text style={s.tickerCategory}>EB-1 INDIA</Text>
                <Text style={s.tickerDate}>CURRENT</Text>
                <View style={s.movementRow}>
                  <Text style={s.movementTeal}>Zero Backlog</Text>
                </View>
              </View>
            </View>

            {/* Hero Action CTA */}
            <View style={s.heroActions}>
              <Pressable
                style={s.heroTrackBtn}
                onPress={() => Alert.alert('Priority Date Tracking', 'You will receive push notifications when your priority date moves.')}
              >
                <AppIcon name="bell" size={16} color="#431ebe" />
                <Text style={s.heroTrackBtnText}>Track Your Priority Date</Text>
              </Pressable>
              <Text style={s.heroTrackingCount}>14.8k Bandhus tracking</Text>
            </View>
          </View>

          {/* Topic Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow}>
            <Pressable
              style={[s.chip, activeTab === 'all' && s.chipActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[s.chipText, activeTab === 'all' && s.chipTextActive]}>All Guides (32)</Text>
            </Pressable>
            <Pressable
              style={[s.chip, activeTab === 'h1b' && s.chipActive]}
              onPress={() => setActiveTab('h1b')}
            >
              <Text style={[s.chipText, activeTab === 'h1b' && s.chipTextActive]}>H-1B & Stamping</Text>
            </Pressable>
            <Pressable
              style={[s.chip, activeTab === 'opt' && s.chipActive]}
              onPress={() => setActiveTab('opt')}
            >
              <Text style={[s.chipText, activeTab === 'opt' && s.chipTextActive]}>OPT / STEM</Text>
            </Pressable>
            <Pressable
              style={[s.chip, activeTab === 'greencard' && s.chipActive]}
              onPress={() => setActiveTab('greencard')}
            >
              <Text style={[s.chipText, activeTab === 'greencard' && s.chipTextActive]}>Green Card</Text>
            </Pressable>
            <Pressable
              style={[s.chip, activeTab === 'parents' && s.chipActive]}
              onPress={() => setActiveTab('parents')}
            >
              <Text style={[s.chipText, activeTab === 'parents' && s.chipTextActive]}>B-1/B-2 Parents</Text>
            </Pressable>
          </ScrollView>

          {/* Guide Cards */}
          <View style={s.guidesList}>
            {/* Guide 1: H-1B */}
            {(activeTab === 'all' || activeTab === 'h1b') && (
              <View style={s.guideCard}>
                <View style={s.guideTopRow}>
                  <View style={s.guideTagBlue}>
                    <Text style={s.guideTagBlueText}>Checklist Included • Hyderabad/Chennai VAC</Text>
                  </View>
                  <Pressable onPress={() => toggleSave('guide-h1b')}>
                    <AppIcon
                      name="star"
                      size={18}
                      color={savedGuides.has('guide-h1b') ? '#ff7e33' : '#a5adc6'}
                    />
                  </Pressable>
                </View>

                <Text style={s.guideTitle}>
                  H-1B Dropbox & Stamping Guide (Hyderabad & Chennai VAC 2026)
                </Text>

                <View style={s.bulletsBox}>
                  <Text style={s.bulletItem}>• 221(g) blue slip prevention & client letter formats</Text>
                  <Text style={s.bulletItem}>• DS-160 photo specifications & fee receipt locking</Text>
                  <Text style={s.bulletItem}>• Biometrics slot booking & document collection tips</Text>
                </View>

                <View style={s.guideFooter}>
                  <Text style={s.authorText}>Karthik V. • 8 yrs H-1B Veteran</Text>
                  <View style={s.ratingRow}>
                    <AppIcon name="star" size={13} color="#ff7e33" />
                    <Text style={s.ratingText}>4.9 (342) • 2.4k views</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Guide 2: OPT STEM */}
            {(activeTab === 'all' || activeTab === 'opt') && (
              <View style={s.guideCard}>
                <View style={s.guideTopRow}>
                  <View style={[s.guideTagBlue, { backgroundColor: 'rgba(0,105,107,0.08)' }]}>
                    <Text style={[s.guideTagBlueText, { color: '#00696b' }]}>
                      Step-by-Step Verified • STEM OPT 24-Month
                    </Text>
                  </View>
                  <Pressable onPress={() => toggleSave('guide-opt')}>
                    <AppIcon
                      name="star"
                      size={18}
                      color={savedGuides.has('guide-opt') ? '#ff7e33' : '#a5adc6'}
                    />
                  </Pressable>
                </View>

                <Text style={s.guideTitle}>
                  F-1 OPT to STEM Extension: Step-by-Step Filing & Form I-983
                </Text>

                <View style={s.bulletsBox}>
                  <Text style={s.bulletItem}>• Form I-983 training plan sample packet & DSO approval window</Text>
                  <Text style={s.bulletItem}>• Form I-765 online e-filing walkthrough with live screenshots</Text>
                  <Text style={s.bulletItem}>• 180-day automatic work authorization grace period safeguards</Text>
                </View>

                <View style={s.guideFooter}>
                  <Text style={s.authorText}>Pooja Varma • Software Engineer, Dell</Text>
                  <View style={s.ratingRow}>
                    <AppIcon name="star" size={13} color="#ff7e33" />
                    <Text style={s.ratingText}>4.8 (189) • 1.8k views</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Guide 3: B-2 Parents */}
            {(activeTab === 'all' || activeTab === 'parents') && (
              <View style={s.guideCard}>
                <View style={s.guideTopRow}>
                  <View style={[s.guideTagBlue, { backgroundColor: '#fff7ed' }]}>
                    <Text style={[s.guideTagBlueText, { color: '#ea580c' }]}>
                      Most Saved Article ★ • Senior Parents Care
                    </Text>
                  </View>
                  <Pressable onPress={() => toggleSave('guide-parents')}>
                    <AppIcon
                      name="star"
                      size={18}
                      color={savedGuides.has('guide-parents') ? '#ff7e33' : '#a5adc6'}
                    />
                  </Pressable>
                </View>

                <Text style={s.guideTitle}>
                  B-2 Parents Visitor Visa: Medical Insurance & Extension Guide
                </Text>

                <View style={s.bulletsBox}>
                  <Text style={s.bulletItem}>• Patriot America Plus vs INF Elite visitor insurance comparison</Text>
                  <Text style={s.bulletItem}>• CBP port-of-entry questions & immigration counter tips</Text>
                  <Text style={s.bulletItem}>• Form I-539 6-month stay extension filing checklist & affidavit</Text>
                </View>

                <View style={s.guideFooter}>
                  <Text style={s.authorText}>Dr. Srinivas Rao • Round Rock, TX</Text>
                  <View style={s.ratingRow}>
                    <AppIcon name="star" size={13} color="#ff7e33" />
                    <Text style={s.ratingText}>5.0 (512) • 4.1k views</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Attorney Consultation Banner */}
          <View style={s.attorneyCard}>
            <View style={s.attorneyHeader}>
              <View style={s.attorneyBadge}>
                <AppIcon name="shield" size={14} color="#00696b" />
                <Text style={s.attorneyBadgeText}>Vetted Legal Network</Text>
              </View>
              <Text style={s.attorneyTag}>Zero Platform Commission</Text>
            </View>

            <Text style={s.attorneyTitle}>Need Personalized Legal Advice?</Text>
            <Text style={s.attorneyBody}>
              Connect with vetted Indian-origin immigration attorneys for H-1B RFE responses, I-140 NIW evaluations, and Green Card filings.
            </Text>

            <View style={s.attorneyProfileRow}>
              <View style={s.attorneyAvatar}>
                <Text style={s.attorneyAvatarText}>RS</Text>
              </View>
              <View style={s.attorneyInfo}>
                <Text style={s.attorneyName}>Rajesh K. Sharma, Esq.</Text>
                <Text style={s.attorneyCredentials}>Licensed Texas Attorney • AILA Member</Text>
              </View>
            </View>

            <Pressable
              style={s.attorneyBookBtn}
              onPress={() => Alert.alert('Attorney Consultation', 'Intro call request forwarded to Attorney Rajesh Sharma. Office will contact you within 24 hours.')}
            >
              <Text style={s.attorneyBookBtnText}>Book Free 15-Min Intro Call</Text>
            </Pressable>
          </View>

          {/* Bottom Nav Links */}
          <View style={s.footerLinks}>
            <AppButton label="Browse All 32 Guides" route="/immigration/resources" variant="secondary" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DEFAULT_IMMIGRATION_DATA: Record<string, CatalogScreenContent> = {
  home: {
    title: 'Immigration & Visa Resources',
    subtitle: 'Guides, legal resources, visa updates, and FAQs for the Indian diaspora.',
    eyebrow: 'Immigration',
    metrics: [
      { label: 'Guides', value: '32' },
      { label: 'FAQ items', value: '120' },
      { label: 'Attorneys', value: '18' },
    ],
    items: [
      { id: 'resources', title: 'Resources', body: 'Browse all guides and official references.', meta: 'Library', route: '/immigration/resources' },
      { id: 'guides', title: 'Step-by-step Guides', body: 'H-1B, OPT, and green card walk-throughs.', meta: 'Guides', route: '/immigration/guides' },
      { id: 'checklists', title: 'Checklists', body: 'Document checklists for visa interviews.', meta: 'Tools', route: '/immigration/checklists' },
      { id: 'faq', title: 'Community FAQ', body: 'Frequently asked questions answered by experts.', meta: 'Answers', route: '/immigration/faq' },
    ],
  },
  resources: {
    title: 'Immigration Resource Library',
    subtitle: 'Curated articles and legal references.',
    eyebrow: 'Library',
    metrics: [],
    items: [],
  },
  guides: {
    title: 'Step-by-Step Immigration Guides',
    subtitle: 'Detailed walkthroughs for visa filings.',
    eyebrow: 'Guides',
    metrics: [],
    items: [],
  },
  checklists: {
    title: 'Document Checklists',
    subtitle: 'Stay organized before your interview or filing.',
    eyebrow: 'Checklists',
    metrics: [],
    items: [],
  },
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Community-sourced and attorney-reviewed answers.',
    eyebrow: 'FAQ',
    metrics: [],
    items: [],
  },
  questions: {
    title: 'Ask a Question',
    subtitle: 'Submit an immigration query to the community.',
    eyebrow: 'Q&A',
    metrics: [],
    items: [],
  },
  uscis: {
    title: 'USCIS Official Updates',
    subtitle: 'Direct policy announcements and processing dates.',
    eyebrow: 'Official',
    metrics: [],
    items: [],
  },
  news: {
    title: 'Immigration News',
    subtitle: 'Policy shifts, executive orders, and legal trends.',
    eyebrow: 'News',
    metrics: [],
    items: [],
  },
  saved: {
    title: 'Saved Guides & Checklists',
    subtitle: 'Quick access to your bookmarked legal articles.',
    eyebrow: 'Bookmarks',
    metrics: [],
    items: [],
  },
};

const immigrationRoutes = {
  home: '/immigration',
  resources: '/immigration/resources',
  guides: '/immigration/guides',
  checklists: '/immigration/checklists',
  faq: '/immigration/faq',
  questions: '/immigration/questions',
  uscis: '/immigration/uscis',
  news: '/immigration/news',
  saved: '/immigration/saved',
} as const;

const immigrationActions = {
  home: [
    { label: 'Resources', route: '/immigration/resources' },
    { label: 'Guides', route: '/immigration/guides' },
    { label: 'Checklists', route: '/immigration/checklists' },
    { label: 'FAQ', route: '/immigration/faq' },
  ],
  resources: [
    { label: 'Guides', route: '/immigration/guides' },
    { label: 'Home', route: '/immigration' },
  ],
  guides: [
    { label: 'Checklists', route: '/immigration/checklists' },
    { label: 'Home', route: '/immigration' },
  ],
  checklists: [
    { label: 'Guides', route: '/immigration/guides' },
    { label: 'Home', route: '/immigration' },
  ],
  faq: [
    { label: 'Questions', route: '/immigration/questions' },
    { label: 'Home', route: '/immigration' },
  ],
  questions: [
    { label: 'FAQ', route: '/immigration/faq' },
    { label: 'Home', route: '/immigration' },
  ],
  uscis: [
    { label: 'News', route: '/immigration/news' },
    { label: 'Home', route: '/immigration' },
  ],
  news: [
    { label: 'USCIS', route: '/immigration/uscis' },
    { label: 'Home', route: '/immigration' },
  ],
  saved: [
    { label: 'Resources', route: '/immigration/resources' },
    { label: 'Home', route: '/immigration' },
  ],
} as const;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#faf8ff' },
  scrollContent: { padding: space.x4, flexGrow: 1 },
  container: { width: '100%', alignSelf: 'center', gap: space.x4 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1, gap: 4 },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#431ebe',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#131b2e',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#625f6e',
    lineHeight: 18,
  },
  searchIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eaedff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bulletinCard: {
    backgroundColor: '#431ebe',
    borderRadius: 20,
    padding: space.x4,
    gap: space.x3,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  bulletinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bulletinTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  bulletinTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  bulletinSyncText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
  },
  bulletinHeroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  tickerGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  tickerCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tickerDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tickerCategory: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '800',
  },
  tickerDate: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  movementRow: {
    marginTop: 2,
  },
  movementGreen: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  movementTeal: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '700',
  },

  heroActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  heroTrackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroTrackBtnText: {
    color: '#431ebe',
    fontSize: 13,
    fontWeight: '800',
  },
  heroTrackingCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
  },

  chipsRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: '#f1f3f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#431ebe',
    borderColor: '#431ebe',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#625f6e',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  guidesList: {
    gap: 12,
  },
  guideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eaedff',
    gap: 10,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  guideTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guideTagBlue: {
    backgroundColor: 'rgba(67, 30, 190, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  guideTagBlueText: {
    color: '#431ebe',
    fontSize: 11,
    fontWeight: '700',
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#131b2e',
    lineHeight: 22,
  },
  bulletsBox: {
    gap: 4,
    backgroundColor: '#faf8ff',
    padding: 10,
    borderRadius: 10,
  },
  bulletItem: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  guideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  authorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#625f6e',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#625f6e',
  },

  attorneyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#eaedff',
    gap: 12,
    shadowColor: '#00696b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  attorneyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attorneyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 105, 107, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  attorneyBadgeText: {
    color: '#00696b',
    fontSize: 11,
    fontWeight: '700',
  },
  attorneyTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#625f6e',
  },
  attorneyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#131b2e',
  },
  attorneyBody: {
    fontSize: 13,
    color: '#625f6e',
    lineHeight: 19,
  },
  attorneyProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#faf8ff',
    padding: 10,
    borderRadius: 12,
  },
  attorneyAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e6f4f4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#00696b',
  },
  attorneyAvatarText: {
    color: '#00696b',
    fontSize: 13,
    fontWeight: '800',
  },
  attorneyInfo: {
    flex: 1,
  },
  attorneyName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#131b2e',
  },
  attorneyCredentials: {
    fontSize: 11,
    color: '#625f6e',
  },
  attorneyBookBtn: {
    backgroundColor: '#00696b',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  attorneyBookBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  footerLinks: {
    paddingTop: space.x2,
  },
});
