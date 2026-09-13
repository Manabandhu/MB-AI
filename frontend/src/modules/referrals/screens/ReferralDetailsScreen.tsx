import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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

import { getReferralDetail, getReferralOffer, getReferralRequest, type Referral } from '@/modules/referrals/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

export function ReferralDetailsScreen() {
  const { referralId } = useLocalSearchParams<{ referralId: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [bookmarked, setBookmarked] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [jobReqId, setJobReqId] = useState('');
  const [fitPitch, setFitPitch] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  const { data: referral, isLoading, isError, refetch } = useQuery({
    queryKey: ['referrals', 'detail', referralId],
    queryFn: () => getReferralDetail(referralId),
    enabled: Boolean(referralId),
  });

  const { data: offerDetails } = useQuery({
    queryKey: ['referrals', 'offer', referralId],
    queryFn: () => getReferralOffer(referralId),
    enabled: Boolean(referralId && referral?.type === 'offer'),
  });

  const { data: requestDetails } = useQuery({
    queryKey: ['referrals', 'request', referralId],
    queryFn: () => getReferralRequest(referralId),
    enabled: Boolean(referralId && referral?.type === 'request'),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isError || !referral) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState title="Referral not found" body="The referral you are looking for does not exist or has been removed." retryLabel="Retry" onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  const data: Referral = referral;

  function getCompanyInitials(title: string): { letter: string; color: string; bg: string } {
    const lower = title.toLowerCase();
    if (lower.includes('google')) return { letter: 'G', color: '#2563EB', bg: '#EFF6FF' };
    if (lower.includes('microsoft')) return { letter: 'M', color: '#0284C7', bg: '#F0F9FF' };
    if (lower.includes('amazon')) return { letter: 'A', color: '#D97706', bg: '#FFFBEB' };
    if (lower.includes('apple')) return { letter: '', color: '#1E1B4B', bg: '#F8FAFC' };
    if (lower.includes('meta')) return { letter: 'M', color: '#0866FF', bg: '#EFF6FF' };
    return { letter: title.charAt(0).toUpperCase() || 'R', color: colors.primary, bg: '#EEF2FF' };
  }

  const company = getCompanyInitials(data.title);

  function handleSendRequest() {
    setRequestSent(true);
    setTimeout(() => {
      setShowRequestModal(false);
      setRequestSent(false);
      setJobReqId('');
      setFitPitch('');
    }, 2000);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top App Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <AppIcon name="chevron-left" size={20} color={colors.ink} />
          </Pressable>
          <View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Referral Details</Text>
              <View style={styles.teluguPill}>
                <Text style={styles.teluguPillText}>రెఫరల్ వివరాలు</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>ManaBandhu Desi Professional Network</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bookmark"
            onPress={() => setBookmarked(!bookmarked)}
            style={styles.iconBtn}
          >
            <AppIcon
              name="star"
              size={18}
              color={bookmarked ? '#EA580C' : colors.muted}
            />
          </Pressable>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          isDesktop && styles.scrollContainerDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isDesktop && styles.mainWrapperDesktop]}>
          {/* Bento Card 1: Role & Company Header */}
          <View style={styles.bentoCard}>
            <View style={styles.roleHeaderRow}>
              <View style={[styles.companyLogo, { backgroundColor: company.bg }]}>
                <Text style={[styles.companyLogoText, { color: company.color }]}>
                  {company.letter}
                </Text>
                <View style={styles.verifiedMiniBadge}>
                  <AppIcon name="check" size={10} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.roleInfo}>
                <View style={styles.roleBadgesRow}>
                  <View style={styles.verifiedReferrerPill}>
                    <AppIcon name="verified-user" size={11} color="#4338CA" />
                    <Text style={styles.verifiedReferrerText}>Verified Referrer</Text>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{data.status.toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={styles.roleTitle}>{data.title}</Text>
                <Text style={styles.roleLocation}>
                  {data.category || 'Tech Referral'} • Austin, TX & Remote
                </Text>
              </View>
            </View>

            {/* Meta Tags Row */}
            <View style={styles.metaPillsRow}>
              <View style={styles.metaPill}>
                <AppIcon name="sparks" size={12} color="#EA580C" />
                <Text style={styles.metaPillText}>Avg reply &lt; 4 hrs</Text>
              </View>
              <View style={styles.metaPill}>
                <AppIcon name="community" size={12} color="#4338CA" />
                <Text style={styles.metaPillText}>Telugu Tech Network</Text>
              </View>
              <View style={[styles.metaPill, { backgroundColor: '#ECFDF5' }]}>
                <AppIcon name="shield" size={12} color="#059669" />
                <Text style={[styles.metaPillText, { color: '#047857' }]}>
                  Zero Brokerage • 100% Free
                </Text>
              </View>
            </View>
          </View>

          {/* Bento Card 2: Referrer Profile */}
          <View style={styles.bentoCard}>
            <View style={styles.referrerProfileRow}>
              <View style={styles.avatarRing}>
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarInitials}>
                    {data.type === 'offer' ? 'VR' : 'MB'}
                  </Text>
                </View>
                <View style={styles.avatarVerifiedCheck}>
                  <AppIcon name="verified-user" size={11} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.referrerInfo}>
                <View style={styles.referrerNameRow}>
                  <Text style={styles.referrerName}>
                    {data.type === 'offer' ? 'Verified Referrer' : 'Verified Requester'}
                  </Text>
                  <AppIcon name="verified-user" size={14} color="#10B981" />
                </View>
                <Text style={styles.referrerRole}>
                  {data.category || 'Professional Network'}
                </Text>
                <Text style={styles.referrerChapter}>
                  ManaBandhu Member Network
                </Text>
              </View>
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCell}>
                <Text style={[styles.metricNumber, { color: '#1E1B4B' }]}>Direct</Text>
                <Text style={styles.metricLabel}>Connection</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={[styles.metricNumber, { color: '#EA580C' }]}>Active</Text>
                <Text style={styles.metricLabel}>Status</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={[styles.metricNumber, { color: '#10B981' }]}>100%</Text>
                <Text style={styles.metricLabel}>Zero Brokerage</Text>
              </View>
            </View>

            {/* Quote Box */}
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>
                {data.description}
              </Text>
            </View>

            {offerDetails?.terms ? (
              <View style={styles.termsBox}>
                <Text style={styles.termsLabel}>Terms & Preferences:</Text>
                <Text style={styles.termsValue}>{offerDetails.terms}</Text>
              </View>
            ) : null}

            {offerDetails?.availability ? (
              <View style={styles.termsBox}>
                <Text style={styles.termsLabel}>Availability:</Text>
                <Text style={styles.termsValue}>{offerDetails.availability}</Text>
              </View>
            ) : null}
          </View>

          {/* Bento Card 3: Eligibility & Criteria */}
          <View style={styles.bentoCard}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIconCircle}>
                <AppIcon name="briefcase" size={15} color="#4338CA" />
              </View>
              <Text style={styles.sectionTitle}>Eligibility & Criteria</Text>
            </View>

            <View style={styles.criteriaList}>
              <View style={styles.criteriaItem}>
                <View style={styles.criteriaBullet}>
                  <AppIcon name="star" size={14} color="#EA580C" />
                </View>
                <View style={styles.criteriaContent}>
                  <Text style={styles.criteriaHeading}>Target Seniority Levels</Text>
                  <Text style={styles.criteriaText}>
                    L4 (Mid-Level), L5 (Senior SWE), and L6 (Staff / Principal).
                  </Text>
                </View>
              </View>

              <View style={styles.criteriaItem}>
                <View style={styles.criteriaBullet}>
                  <AppIcon name="sparks" size={14} color="#4338CA" />
                </View>
                <View style={styles.criteriaContent}>
                  <Text style={styles.criteriaHeading}>Technical Stack & Experience</Text>
                  <Text style={styles.criteriaText}>
                    3+ years experience with Distributed Systems, High-throughput microservices, Go, Java, C++, Python, or Rust.
                  </Text>
                </View>
              </View>

              <View style={styles.criteriaItem}>
                <View style={styles.criteriaBullet}>
                  <AppIcon name="shield" size={14} color="#10B981" />
                </View>
                <View style={styles.criteriaContent}>
                  <Text style={styles.criteriaHeading}>Visa & Work Authorization</Text>
                  <Text style={styles.criteriaText}>
                    H-1B transfer supported, OPT STEM extensions, and Green Card PERM processing for full-time hires.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bento Card 4: What to Prepare */}
          <View style={styles.bentoCard}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <AppIcon name="book" size={15} color="#D97706" />
              </View>
              <Text style={styles.sectionTitle}>What to Prepare Before Requesting</Text>
            </View>

            <View style={styles.checklist}>
              <View style={styles.checklistItem}>
                <View style={styles.numberCircle}>
                  <Text style={styles.numberText}>1</Text>
                </View>
                <View style={styles.checklistContent}>
                  <Text style={styles.checklistTitle}>Updated Resume PDF</Text>
                  <Text style={styles.checklistDesc}>
                    Clean 1-page format highlighting production metrics, scale, and modern tech stack.
                  </Text>
                </View>
              </View>

              <View style={styles.checklistItem}>
                <View style={styles.numberCircle}>
                  <Text style={styles.numberText}>2</Text>
                </View>
                <View style={styles.checklistContent}>
                  <Text style={styles.checklistTitle}>Target Job Requisition ID</Text>
                  <Text style={styles.checklistDesc}>
                    Exact requisition number from the company's careers portal.
                  </Text>
                </View>
              </View>

              <View style={styles.checklistItem}>
                <View style={styles.numberCircle}>
                  <Text style={styles.numberText}>3</Text>
                </View>
                <View style={styles.checklistContent}>
                  <Text style={styles.checklistTitle}>3-Sentence Fit Pitch</Text>
                  <Text style={styles.checklistDesc}>
                    Concise summary explaining why your background matches the target opening.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Community Trust Pledge */}
          <View style={styles.pledgeCard}>
            <AppIcon name="verified-user" size={24} color="#EA580C" />
            <Text style={styles.pledgeTitle}>ManaBandhu Community Pledge</Text>
            <Text style={styles.pledgeText}>
              100% Free & Direct. ManaBandhu members never charge or accept money for job referrals. If anyone asks for payment, report immediately.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={[styles.bottomBarContent, isDesktop && styles.bottomBarContentDesktop]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Message Referrer"
            onPress={() => router.push('/chat')}
            style={styles.secondaryActionBtn}
          >
            <AppIcon name="message" size={18} color="#1E1B4B" />
            <Text style={styles.secondaryActionBtnText}>Message</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Request Referral Introduction"
            onPress={() => setShowRequestModal(true)}
            style={styles.primaryActionBtn}
          >
            <AppIcon name="mail" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionBtnText}>Request Introduction</Text>
          </Pressable>
        </View>
      </View>

      {/* Request Referral Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowRequestModal(false)}>
          <Pressable style={[styles.modalCard, isDesktop && styles.modalCardDesktop]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Referral</Text>
                <Text style={styles.modalSubtitle}>Direct introduction to referrer</Text>
              </View>
              <Pressable onPress={() => setShowRequestModal(false)}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}>✕</Text>
              </Pressable>
            </View>

            {requestSent ? (
              <View style={styles.successBox}>
                <AppIcon name="check" size={32} color="#10B981" />
                <Text style={styles.successHeading}>Request Sent!</Text>
                <Text style={styles.successSubtext}>
                  The referrer will review your request and get back to you shortly.
                </Text>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Job Requisition ID *</Text>
                  <TextInput
                    value={jobReqId}
                    onChangeText={setJobReqId}
                    placeholder="e.g. Req #12948210"
                    placeholderTextColor="#94A3B8"
                    style={styles.modalInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>3-Sentence Fit Pitch *</Text>
                  <TextInput
                    value={fitPitch}
                    onChangeText={setFitPitch}
                    placeholder="Briefly explain your relevant experience and why you are a fit..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    style={[styles.modalInput, styles.modalTextArea]}
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Submit Referral Request"
                  onPress={handleSendRequest}
                  style={styles.submitBtn}
                >
                  <Text style={styles.submitBtnText}>Submit Referral Request</Text>
                </Pressable>
              </View>
            )}
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
  headerBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  teluguPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  teluguPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingHorizontal: space.x4,
    paddingTop: space.x3,
    paddingBottom: 110,
  },
  scrollContainerDesktop: {
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
    gap: space.x4,
  },
  mainWrapperDesktop: {
    maxWidth: 680,
  },
  bentoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: space.x4,
    gap: space.x3,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    gap: space.x3,
  },
  companyLogo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  companyLogoText: {
    fontSize: 22,
    fontWeight: '800',
  },
  verifiedMiniBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#10B981',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  roleInfo: {
    flex: 1,
  },
  roleBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  verifiedReferrerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  verifiedReferrerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  statusPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B4B',
    lineHeight: 22,
  },
  roleLocation: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  metaPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: space.x2,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  referrerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    backgroundColor: '#EA580C',
    position: 'relative',
  },
  avatarInner: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  avatarVerifiedCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  referrerInfo: {
    flex: 1,
  },
  referrerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  referrerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  referrerRole: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    marginTop: 1,
  },
  referrerChapter: {
    fontSize: 11,
    color: '#EA580C',
    fontWeight: '600',
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: space.x2,
  },
  metricCell: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  quoteBox: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#4338CA',
    borderRadius: 8,
    padding: space.x3,
  },
  quoteText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  quoteGreet: {
    fontWeight: '700',
    color: '#4338CA',
    fontStyle: 'normal',
  },
  termsBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: space.x3,
  },
  termsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  termsValue: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  criteriaList: {
    gap: space.x3,
  },
  criteriaItem: {
    flexDirection: 'row',
    gap: space.x3,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: space.x3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  criteriaBullet: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  criteriaContent: {
    flex: 1,
  },
  criteriaHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  criteriaText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 17,
  },
  checklist: {
    gap: space.x3,
  },
  checklistItem: {
    flexDirection: 'row',
    gap: space.x3,
  },
  numberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  checklistContent: {
    flex: 1,
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  checklistDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
    lineHeight: 17,
  },
  pledgeCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: radius.card,
    padding: space.x4,
    alignItems: 'center',
    gap: 6,
  },
  pledgeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#C2410C',
  },
  pledgeText: {
    fontSize: 12,
    color: '#9A3412',
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  bottomBarContent: {
    flexDirection: 'row',
    gap: space.x2,
    width: '100%',
  },
  bottomBarContentDesktop: {
    maxWidth: 680,
    alignSelf: 'center',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  primaryActionBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    borderRadius: radius.control,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionBtnText: {
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
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    padding: space.x5,
    gap: space.x4,
  },
  modalCardDesktop: {
    maxWidth: 480,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  modalBody: {
    gap: space.x3,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.control,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1E1B4B',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    borderRadius: radius.control,
    alignItems: 'center',
    marginTop: space.x1,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: space.x4,
    gap: space.x2,
  },
  successHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  successSubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
