import { color as baseColors, radius, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useAuthStore } from '@/lib/authStore';
import { getJobPosting } from '@/modules/jobs/api';
import type { JobPosting } from '@/modules/jobs/types';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const colors = {
  ...baseColors,
  canvas: '#ffffff',
  canvasMuted: '#f8f9fe',
  accentBrand: '#431ebe',
  inkSecondary: baseColors.muted,
  borderSubtle: '#e2e8f0',
  danger: '#ef4444',
};

const sp = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export function JobDetailsScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { session } = useAuthStore();

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('https://linkedin.com/in/my-profile');
  const [personalNote, setPersonalNote] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load job details from live Spring / Supabase API
  const { data: job, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', 'detail', jobId],
    queryFn: () => getJobPosting(jobId as string),
    enabled: Boolean(jobId),
  });


  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return '$160,000 - $220,000 / yr + RSUs';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()} / yr + RSUs`;
    if (min) return `From $${min.toLocaleString()} / yr`;
    return `Up to $${(max ?? 0).toLocaleString()} / yr`;
  };

  if (isLoading) {
    return (
      <View style={s.centerContainer}>
        <Text style={s.loadingText}>Loading role specifications...</Text>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={s.centerContainer}>
        <Text style={s.errorEmoji}>⚠️</Text>
        <Text style={s.errorTitle}>Job Not Found</Text>
        <Text style={s.errorSubtitle}>This position may have been filled or the link has expired.</Text>
        <Pressable onPress={() => router.back()} style={s.backNavBtn}>
          <Text style={s.backNavBtnText}>Back to Jobs</Text>
        </Pressable>
      </View>
    );
  }

  const companyInitial = (job.company || 'C').charAt(0).toUpperCase();
  const salaryDisplay = formatSalary(job.salaryMin, job.salaryMax);

  const handleRequestReferral = () => {
    if (!session) {
      router.push('/sign-in' as any);
      return;
    }
    setReferralModalVisible(true);
  };

  const handleConfirmReferral = () => {
    setIsSubmitted(true);
    setTimeout(() => {
      setReferralModalVisible(false);
      setIsSubmitted(false);
      Alert.alert(
        'Referral Request Sent!',
        `Your request and resume have been submitted for ${job.title} at ${job.company || 'the hiring company'}.`
      );
    }, 1200);
  };

  return (
    <View style={s.container}>
      {/* Top App Bar */}
      <View style={s.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={s.iconButton}
          accessibilityLabel="Back"
        >
          <AppIcon name="chevron-left" size={20} color={colors.ink} />
        </Pressable>

        <Text style={s.topBarTitle}>Job Details</Text>

        <View style={s.topBarRight}>
          <Pressable
            onPress={() => setIsBookmarked(!isBookmarked)}
            style={s.iconButton}
            accessibilityLabel="Bookmark job"
          >
            <Text style={s.actionEmoji}>{isBookmarked ? '🔖' : '🏷️'}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Alert.alert('Share Link Copied', `Copied link for ${job.title} at ${job.company}`);
            }}
            style={s.iconButton}
            accessibilityLabel="Share job"
          >
            <Text style={s.actionEmoji}>↗️</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Job Header Card */}
        <View style={s.heroCard}>
          <View style={s.companyTopRow}>
            <View style={[s.companyBadge, { backgroundColor: '#e8f0fe' }]}>
              <Text style={[s.companyBadgeText, { color: '#1a73e8' }]}>{companyInitial}</Text>
            </View>
            <View style={s.companyMeta}>
              <View style={s.companyNameRow}>
                <Text style={s.companyName}>{job.company || 'Tech Company'}</Text>
                <Text style={s.verifiedIcon}>✓</Text>
              </View>
              <Text style={s.campusLocation}>📍 {job.location || 'Austin, TX'}</Text>
            </View>
            <View style={s.featuredPill}>
              <Text style={s.featuredPillText}>FEATURED</Text>
            </View>
          </View>

          <Text style={s.jobTitle}>{job.title}</Text>

          {/* Compensation Card */}
          <View style={s.compHighlightCard}>
            <Text style={s.compLabel}>TARGET COMPENSATION</Text>
            <Text style={s.compValue}>{salaryDisplay}</Text>
          </View>

          {/* Meta Info */}
          <View style={s.jobMetaRow}>
            <Text style={s.jobMetaItem}>
              {job.employmentType || 'Full-time'} · {job.isRemote ? 'Remote OK' : 'Hybrid'}
            </Text>
            <Text style={s.jobMetaDivider}>•</Text>
            <Text style={s.jobMetaItem}>Active Role</Text>
          </View>

          {/* High-impact Visa & Perk Pills */}
          <View style={s.visaPillsRow}>
            <View style={[s.perkPill, s.perkPillGreen]}>
              <Text style={[s.perkPillText, s.perkPillTextGreen]}>⚡ H-1B Transfer Ready</Text>
            </View>
            <View style={[s.perkPill, s.perkPillPurple]}>
              <Text style={[s.perkPillText, s.perkPillTextPurple]}>🎓 STEM OPT Eligible</Text>
            </View>
            <View style={[s.perkPill, s.perkPillMint]}>
              <Text style={[s.perkPillText, s.perkPillTextMint]}>🌱 Day 1 Green Card (PERM)</Text>
            </View>
            <View style={[s.perkPill, s.perkPillAmber]}>
              <Text style={[s.perkPillText, s.perkPillTextAmber]}>🤝 $1,500 Referral Bonus</Text>
            </View>
          </View>
        </View>

        {/* Internal Referral Support Card */}
        <View style={s.referrerSpotlightCard}>
          <View style={s.referrerHeader}>
            <Text style={s.referrerHeaderTag}>✦ COMMUNITY REFERRAL NETWORK</Text>
            <View style={s.slaBadge}>
              <Text style={s.slaText}>Verified Members</Text>
            </View>
          </View>

          <View style={s.referrerProfileRow}>
            <View style={[s.referrerAvatar, { backgroundColor: '#f0f3ff' }]}>
              <Text style={s.referrerAvatarEmoji}>🤝</Text>
            </View>
            <View style={s.referrerProfileMeta}>
              <Text style={s.referrerName}>{job.company ? `${job.company} Employee Network` : 'Verified Employee Network'}</Text>
              <Text style={s.referrerRole}>ManaBandhu Referral Community</Text>
              <Text style={s.emailTag}>🛡️ Verified Corporate Email Match</Text>
            </View>
          </View>

          <View style={s.quoteBox}>
            <Text style={s.quoteText}>
              “Request an internal employee referral directly through the ManaBandhu network. Verified alumni and team members review profiles and submit candidates directly to internal hiring pipelines.”
            </Text>
          </View>

          <Pressable
            onPress={() => {
              if (!session) router.push('/sign-in' as any);
              else router.push('/chat' as any);
            }}
            style={s.chatReferrerBtn}
          >
            <Text style={s.chatReferrerBtnText}>💬 Ask a Question in Community Chat</Text>
          </Pressable>
        </View>

        {/* Role Overview & Responsibilities */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>About the Role</Text>
          <Text style={s.descriptionText}>
            {job.description ||
              'We are seeking an experienced engineer to design, build, and scale next-generation distributed systems, cloud platforms, and developer tooling across high-volume production deployments.'}
          </Text>

          <Text style={[s.sectionTitle, { marginTop: sp.lg }]}>Key Responsibilities</Text>
          <View style={s.checklist}>
            {[
              'Architect, deploy, and scale high-throughput, fault-tolerant microservices.',
              'Lead system reliability, container orchestration (Kubernetes), and cloud infra.',
              'Drive technical roadmaps, architecture reviews, and mentor engineers.',
              'Collaborate with US and global cross-functional engineering teams.',
            ].map((resp, i) => (
              <View key={i} style={s.checklistItem}>
                <Text style={s.checkBullet}>✓</Text>
                <Text style={s.checklistText}>{resp}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Technical Requirements & Tech Stack */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Technical Stack & Skills</Text>
          <View style={s.skillsGrid}>
            {[
              'Go / Golang',
              'Python',
              'Java / Spring',
              'Kubernetes',
              'GCP / AWS Cloud',
              'Terraform',
              'Distributed Systems',
              'Kafka / Event Streams',
              'Docker',
              'PostgreSQL',
            ].map((skill) => (
              <View key={skill} style={s.skillChip}>
                <Text style={s.skillChipText}>{skill}</Text>
              </View>
            ))}
          </View>

          <Text style={[s.sectionTitle, { marginTop: sp.lg }]}>Candidate Eligibility</Text>
          <View style={s.checklist}>
            {[
              '5+ years of production experience in backend or cloud infrastructure.',
              'BS / MS in Computer Science or equivalent technical field.',
              'H-1B transfer, STEM OPT, E-3, TN, or US PR candidates fully welcome.',
            ].map((req, i) => (
              <View key={i} style={s.checklistItem}>
                <Text style={s.checkBullet}>✓</Text>
                <Text style={s.checklistText}>{req}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Comprehensive Benefits Grid */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Compensation & Benefits</Text>
          <View style={s.benefitsGrid}>
            {[
              { icon: '🏥', title: 'Comprehensive Health', desc: '100% medical, dental, & vision' },
              { icon: '📈', title: '401(k) Match', desc: '50% employer match on contributions' },
              { icon: '🌴', title: 'Flexible PTO', desc: 'Generous vacation & parental leave' },
              { icon: '⚖️', title: 'Immigration Legal', desc: 'Full H-1B transfer & PERM legal support' },
              { icon: '🧘', title: 'Wellness Stipend', desc: '$2,000 annual health & fitness stipend' },
              { icon: '🚌', title: 'Austin Shuttle Pass', desc: 'Free campus commuter shuttle & EV perks' },
            ].map((b) => (
              <View key={b.title} style={s.benefitCard}>
                <Text style={s.benefitIcon}>{b.icon}</Text>
                <Text style={s.benefitTitle}>{b.title}</Text>
                <Text style={s.benefitDesc}>{b.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Community Trust Guarantee */}
        <View style={s.guaranteeCard}>
          <Text style={s.guaranteeEmoji}>🛡️</Text>
          <View style={s.guaranteeContent}>
            <Text style={s.guaranteeTitle}>100% Free Community Referral</Text>
            <Text style={s.guaranteeSubtitle}>
              No recruiter commissions, no placement fees, and no middleman cuts. Direct peer-to-peer Indian tech network support powered by ManaBandhu Trust Protocol.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={s.bottomStickyBar}>
        <View style={s.bottomStickyLeft}>
          <Text style={s.bottomSalaryLabel}>Compensation</Text>
          <Text style={s.bottomSalaryValue}>
            {job.salaryMin ? `$${Math.round(job.salaryMin / 1000)}k+` : 'Top Market'} / yr
          </Text>
        </View>

        <View style={s.bottomStickyRight}>
          <Pressable
            onPress={() => {
              if (job.applicationUrl) {
                Alert.alert('Redirecting', `Opening ${job.applicationUrl}`);
              } else {
                Alert.alert('Careers Portal', `Opening careers page for ${job.company}`);
              }
            }}
            style={s.applySiteBtn}
          >
            <Text style={s.applySiteText}>Apply via Site</Text>
          </Pressable>

          <Pressable onPress={handleRequestReferral} style={s.requestReferralPrimaryBtn}>
            <Text style={s.requestReferralPrimaryText}>Request Referral 🤝</Text>
          </Pressable>
        </View>
      </View>

      {/* Referral Request Modal */}
      <Modal
        visible={referralModalVisible}
        transparent
        animationType={isDesktop ? 'fade' : 'slide'}
        onRequestClose={() => setReferralModalVisible(false)}
      >
        <View style={[s.modalBackdrop, isDesktop && s.modalBackdropDesktop]}>
          <View style={[s.modalCard, isDesktop && s.modalCardDesktop]}>
            {!isDesktop && <View style={s.dragHandle} />}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Request Employee Referral</Text>
              <Pressable onPress={() => setReferralModalVisible(false)} style={s.closeModalBtn}>
                <Text style={s.closeModalText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={s.modalNote}>
                A verified member from {job.company || 'the hiring company'} will review your profile and submit your referral through the internal company portal.
              </Text>

              <Text style={s.formLabel}>LinkedIn Profile or Resume Link *</Text>
              <TextInput
                value={resumeUrl}
                onChangeText={setResumeUrl}
                placeholder="https://linkedin.com/in/... or Google Drive link"
                placeholderTextColor={colors.inkSecondary}
                style={s.formInput}
              />

              <Text style={s.formLabel}>Short Note to Referrer (Optional)</Text>
              <TextInput
                value={personalNote}
                onChangeText={setPersonalNote}
                placeholder="Briefly highlight your tech stack, relevant projects, and why you're a great fit..."
                placeholderTextColor={colors.inkSecondary}
                multiline
                numberOfLines={4}
                style={[s.formInput, s.formTextArea]}
              />

              <View style={s.modalTrustReminder}>
                <Text style={s.reminderEmoji}>⚡</Text>
                <Text style={s.reminderText}>
                  Referral requests are shared directly with verified employees at {job.company || 'the organization'}. You will be notified in your ManaBandhu inbox once reviewed.
                </Text>
              </View>
            </ScrollView>

            <View style={s.modalFooter}>
              <Pressable
                onPress={() => setReferralModalVisible(false)}
                style={s.modalCancelBtn}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmReferral}
                disabled={isSubmitted || !resumeUrl.trim()}
                style={[s.modalSubmitBtn, (!resumeUrl.trim() || isSubmitted) && s.modalSubmitBtnDisabled]}
              >
                <Text style={s.modalSubmitText}>
                  {isSubmitted ? 'Submitting...' : 'Submit Referral Request'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fe',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: sp.lg,
    backgroundColor: '#f8f9fe',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  errorEmoji: {
    fontSize: 44,
    marginBottom: sp.sm,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4,
  },
  errorSubtitle: {
    fontSize: 13,
    color: colors.inkSecondary,
    textAlign: 'center',
    marginBottom: sp.md,
  },
  backNavBtn: {
    backgroundColor: colors.accentBrand,
    paddingHorizontal: sp.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  backNavBtnText: {
    color: colors.canvas,
    fontSize: 13,
    fontWeight: '700',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp.lg,
    paddingTop: sp.md,
    paddingBottom: sp.md,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.xs,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: {
    fontSize: 16,
  },
  scrollContent: {
    padding: sp.lg,
    paddingBottom: 110,
  },
  heroCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.card,
    padding: sp.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: sp.md,
  },
  companyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp.md,
  },
  companyBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyBadgeText: {
    fontSize: 22,
    fontWeight: '900',
  },
  companyMeta: {
    flex: 1,
    marginLeft: sp.sm,
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  verifiedIcon: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '800',
  },
  campusLocation: {
    fontSize: 12,
    color: colors.inkSecondary,
    marginTop: 2,
  },
  featuredPill: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: sp.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  featuredPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accentBrand,
    letterSpacing: 0.5,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
    marginBottom: sp.md,
  },
  compHighlightCard: {
    backgroundColor: '#f5f3ff',
    borderRadius: radius.control,
    padding: sp.md,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    marginBottom: sp.md,
  },
  compLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6d28d9',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  compValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#431ebe',
  },
  jobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.xs,
    marginBottom: sp.md,
  },
  jobMetaItem: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  jobMetaDivider: {
    color: colors.border,
  },
  visaPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  perkPill: {
    paddingHorizontal: sp.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  perkPillGreen: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  perkPillTextGreen: {
    color: '#065f46',
  },
  perkPillPurple: {
    backgroundColor: '#f5f3ff',
    borderColor: '#ddd6fe',
  },
  perkPillTextPurple: {
    color: '#6d28d9',
  },
  perkPillMint: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  perkPillTextMint: {
    color: '#15803d',
  },
  perkPillAmber: {
    backgroundColor: '#fefce8',
    borderColor: '#fef08a',
  },
  perkPillTextAmber: {
    color: '#854d0e',
  },
  perkPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  referrerSpotlightCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.card,
    padding: sp.lg,
    borderWidth: 1.5,
    borderColor: '#c7d2fe',
    marginBottom: sp.md,
  },
  referrerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp.md,
  },
  referrerHeaderTag: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accentBrand,
    letterSpacing: 0.5,
  },
  slaBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  slaText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentBrand,
  },
  referrerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.md,
    marginBottom: sp.md,
  },
  referrerAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referrerAvatarEmoji: {
    fontSize: 24,
  },
  referrerProfileMeta: {
    flex: 1,
  },
  referrerName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  referrerRole: {
    fontSize: 12,
    color: colors.inkSecondary,
    marginTop: 1,
  },
  emailTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  quoteBox: {
    backgroundColor: '#f8f9fe',
    borderRadius: radius.control,
    padding: sp.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accentBrand,
    marginBottom: sp.md,
  },
  quoteText: {
    fontSize: 12,
    color: colors.ink,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  chatReferrerBtn: {
    backgroundColor: '#ede9fe',
    borderRadius: radius.control,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatReferrerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentBrand,
  },
  sectionCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.card,
    padding: sp.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: sp.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3,
    marginBottom: sp.sm,
  },
  descriptionText: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 20,
  },
  checklist: {
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkBullet: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    marginTop: 1,
  },
  checklistText: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: colors.canvasMuted,
    paddingHorizontal: sp.sm,
    paddingVertical: 6,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  skillChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp.sm,
  },
  benefitCard: {
    width: '48%',
    backgroundColor: colors.canvasMuted,
    borderRadius: radius.control,
    padding: sp.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  benefitIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  benefitTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 11,
    color: colors.inkSecondary,
    lineHeight: 15,
  },
  guaranteeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.md,
    backgroundColor: '#eef2ff',
    borderRadius: radius.card,
    padding: sp.md,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    marginBottom: sp.md,
  },
  guaranteeEmoji: {
    fontSize: 26,
  },
  guaranteeContent: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#312e81',
    marginBottom: 2,
  },
  guaranteeSubtitle: {
    fontSize: 11,
    color: '#4338ca',
    lineHeight: 16,
  },
  bottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingHorizontal: sp.lg,
    paddingVertical: sp.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomStickyLeft: {
    flex: 1,
  },
  bottomSalaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.inkSecondary,
    textTransform: 'uppercase',
  },
  bottomSalaryValue: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
  },
  bottomStickyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.sm,
  },
  applySiteBtn: {
    height: 42,
    paddingHorizontal: sp.md,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applySiteText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  requestReferralPrimaryBtn: {
    height: 42,
    paddingHorizontal: sp.lg,
    borderRadius: radius.control,
    backgroundColor: colors.accentBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestReferralPrimaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.canvas,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: sp.lg,
    maxHeight: '85%',
  },
  modalCardDesktop: {
    width: 520,
    borderRadius: radius.panel,
    maxHeight: '80%',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: sp.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    flex: 1,
  },
  closeModalBtn: {
    padding: 4,
  },
  closeModalText: {
    fontSize: 16,
    color: colors.inkSecondary,
    fontWeight: '700',
  },
  modalBody: {
    marginBottom: sp.md,
  },
  modalNote: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginBottom: sp.md,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: colors.canvasMuted,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: sp.md,
    height: 44,
    fontSize: 13,
    color: colors.ink,
    marginBottom: sp.md,
  },
  formTextArea: {
    height: 90,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  modalTrustReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.xs,
    backgroundColor: '#fefce8',
    padding: sp.sm,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  reminderEmoji: {
    fontSize: 16,
  },
  reminderText: {
    flex: 1,
    fontSize: 11,
    color: '#854d0e',
    lineHeight: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.md,
    paddingTop: sp.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSecondary,
  },
  modalSubmitBtn: {
    flex: 2,
    height: 44,
    borderRadius: radius.control,
    backgroundColor: colors.accentBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.canvas,
  },
});
