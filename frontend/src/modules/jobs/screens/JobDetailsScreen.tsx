import { formatSalaryRange } from '@manabandhu/core';
import { breakpoint, radius } from '@manabandhu/design-system';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuthStore } from '@/lib/authStore';
import { getJobPosting } from '@/modules/jobs/api';
import { createReferralRequest } from '@/modules/referrals/api';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';
import { useWindowDimensions } from '@/platform/windowDimensions';

const createScreenColors = (palette: ScreenPalette) => ({
  ...palette,
  canvas: palette.surface,
  canvasMuted: palette.surfaceContainerLow,
  accentBrand: palette.primary,
  inkSecondary: palette.muted,
  borderSubtle: palette.border,
  danger: palette.error,
});

const sp = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export function JobDetailsScreen() {
  const { styles: s, palette } = useScreenStyles(createScreenStyles);
  const colors = createScreenColors(palette);
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= breakpoint.medium;
  const { session } = useAuthStore();

  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [referralError, setReferralError] = useState<string | null>(null);

  // Load job details from live Spring / Supabase API
  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['jobs', 'detail', jobId],
    queryFn: () => getJobPosting(jobId as string),
    enabled: Boolean(jobId),
  });

  const referralMutation = useMutation({
    mutationFn: () => {
      if (!job) throw new Error('Job not loaded');
      const note = personalNote.trim();
      return createReferralRequest({
        title: `Referral for ${job.title}${job.company ? ` at ${job.company}` : ''}`,
        description: [`Profile: ${resumeUrl.trim()}`, note].filter(Boolean).join('\n\n'),
        category: 'jobs',
        details: `Job posting ${job.id}`,
        urgency: 'medium',
      });
    },
    onSuccess: () => {
      setReferralModalVisible(false);
      setResumeUrl('');
      setPersonalNote('');
      Alert.alert('Referral request posted', 'You can track it under My Referrals.');
    },
    onError: (err: Error) => setReferralError(err.message),
  });

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
        <Text style={s.errorSubtitle}>
          This position may have been filled or the link has expired.
        </Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={s.backNavBtn}>
          <Text style={s.backNavBtnText}>Back to Jobs</Text>
        </Pressable>
      </View>
    );
  }

  const companyLabel = job.company || 'Company not listed';
  const companyInitial = (job.company || '?').charAt(0).toUpperCase();
  const salaryDisplay =
    formatSalaryRange(job.salaryMin, job.salaryMax, { compact: false }) ?? 'Not listed';
  const metaParts = [job.employmentType, job.isRemote ? 'Remote OK' : null].filter(
    (part): part is string => Boolean(part),
  );

  const handleRequestReferral = () => {
    if (!session) {
      router.push('/sign-in' as Href);
      return;
    }
    setReferralError(null);
    setReferralModalVisible(true);
  };

  const handleConfirmReferral = () => {
    setReferralError(null);
    referralMutation.mutate();
  };

  const handleApply = async () => {
    if (!job.applicationUrl) return;
    try {
      await Linking.openURL(job.applicationUrl);
    } catch {
      Alert.alert('Unable to open link', job.applicationUrl);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: job.applicationUrl
          ? `${job.title} at ${companyLabel}: ${job.applicationUrl}`
          : `${job.title} at ${companyLabel}`,
      });
    } catch (err) {
      Alert.alert('Unable to share', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  return (
    <View style={s.container}>
      {/* Top App Bar */}
      <View style={s.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={s.iconButton}
          accessibilityLabel="Back"
        >
          <AppIcon name="chevron-left" size={20} color={colors.ink} />
        </Pressable>

        <Text style={s.topBarTitle}>Job Details</Text>

        <View style={s.topBarRight}>
          <Pressable
            accessibilityRole="button"
            onPress={handleShare}
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
                <Text style={s.companyName}>{companyLabel}</Text>
              </View>
              <Text style={s.campusLocation}>
                📍 {job.location || (job.isRemote ? 'Remote' : 'Location not listed')}
              </Text>
            </View>
          </View>

          <Text style={s.jobTitle}>{job.title}</Text>

          {/* Compensation Card */}
          <View style={s.compHighlightCard}>
            <Text style={s.compLabel}>COMPENSATION</Text>
            <Text style={s.compValue}>{salaryDisplay}</Text>
          </View>

          {/* Meta Info */}
          <View style={s.jobMetaRow}>
            {metaParts.length > 0 ? (
              <>
                <Text style={s.jobMetaItem}>{metaParts.join(' · ')}</Text>
                <Text style={s.jobMetaDivider}>•</Text>
              </>
            ) : null}
            <Text style={s.jobMetaItem}>
              Posted {new Date(job.createdAt).toLocaleDateString()}
              {job.status ? ` · ${job.status.toLowerCase()}` : ''}
            </Text>
          </View>
        </View>

        {/* Role Overview */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>About the Role</Text>
          <Text style={s.descriptionText}>
            {job.description || 'The poster has not added a description for this role.'}
          </Text>
        </View>

        {/* Community referral pointer */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Looking for a referral?</Text>
          <Text style={s.descriptionText}>
            Send a referral request to the community, or browse open referral offers from members.
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/referrals' as Href)}
            style={s.chatReferrerBtn}
          >
            <Text style={s.chatReferrerBtnText}>Browse Referral Offers</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={s.bottomStickyBar}>
        <View style={s.bottomStickyLeft}>
          <Text style={s.bottomSalaryLabel}>Compensation</Text>
          <Text style={s.bottomSalaryValue}>
            {job.salaryMin ? `$${Math.round(job.salaryMin / 1000)}k+ / yr` : 'Not listed'}
          </Text>
        </View>

        <View style={s.bottomStickyRight}>
          {job.applicationUrl ? (
            <Pressable accessibilityRole="button" onPress={handleApply} style={s.applySiteBtn}>
              <Text style={s.applySiteText}>Apply via Site</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={handleRequestReferral}
            style={s.requestReferralPrimaryBtn}
          >
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
              <Pressable
                accessibilityRole="button"
                onPress={() => setReferralModalVisible(false)}
                style={s.closeModalBtn}
              >
                <Text style={s.closeModalText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={s.modalNote}>
                Your request is posted to the community referrals board so members who can refer for{' '}
                {companyLabel} can respond.
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

              {referralError ? (
                <View style={s.modalTrustReminder}>
                  <Text style={s.reminderEmoji}>⚠️</Text>
                  <Text style={s.reminderText}>{referralError}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={s.modalFooter}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setReferralModalVisible(false)}
                style={s.modalCancelBtn}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleConfirmReferral}
                disabled={referralMutation.isPending || !resumeUrl.trim()}
                style={[
                  s.modalSubmitBtn,
                  (!resumeUrl.trim() || referralMutation.isPending) && s.modalSubmitBtnDisabled,
                ]}
              >
                <Text style={s.modalSubmitText}>
                  {referralMutation.isPending ? 'Submitting...' : 'Submit Referral Request'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createScreenStyles = (palette: ScreenPalette) => {
  const colors = createScreenColors(palette);
  return StyleSheet.create({
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
      minHeight: 44,
      minWidth: 44,
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
      minHeight: 44,
      minWidth: 44,
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
    campusLocation: {
      fontSize: 12,
      color: colors.inkSecondary,
      marginTop: 2,
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
      color: palette.primary,
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
    chatReferrerBtn: {
      minHeight: 44,
      minWidth: 44,
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
      minHeight: 44,
      minWidth: 44,
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
      minHeight: 44,
      minWidth: 44,
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
    closeModalBtn: { minHeight: 44, minWidth: 44, padding: 4 },
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
      fontSize: 16,
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
      minHeight: 44,
      minWidth: 44,
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
      minHeight: 44,
      minWidth: 44,
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
};
