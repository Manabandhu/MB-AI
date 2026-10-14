import { formatRelative, formatSalaryRange } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { shareLink } from '@/lib/share';
import { applyToJob, deleteJobPosting, getJobPosting, updateJobPosting } from '@/modules/jobs/api';
import { jobStatusIs } from '@/modules/jobs/utils/jobForm';
import { createReferralRequest } from '@/modules/referrals/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ACTION_BAR_SPACE, ActionBar } from '@/modules/shared/ui/ActionBar';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Card } from '@/modules/shared/ui/Card';
import { useConfirm } from '@/modules/shared/ui/ConfirmSheet';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { errorText, showError, showMessage } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';
import { TextField } from '@/modules/shared/ui/TextField';

const LINK = /^https?:\/\/\S+\.\S+/i;

type Sheet = 'apply' | 'referral' | null;

/**
 * One job. Members apply in the app (and/or on the employer's site) or ask the community for a referral; the
 * poster edits, closes/reopens, or deletes it instead.
 */
export function JobDetailsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const userId = useAuthStore((s) => s.user?.id);

  const [sheet, setSheet] = useState<Sheet>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [profileLink, setProfileLink] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const jobQuery = useQuery({
    queryKey: ['jobs', 'detail', jobId],
    queryFn: () => getJobPosting(String(jobId)),
    enabled: Boolean(jobId),
  });
  const job = jobQuery.data;

  const closeSheet = () => {
    setSheet(null);
    setFormError(null);
  };

  const applyMutation = useMutation({
    mutationFn: () =>
      applyToJob(String(jobId), {
        coverLetter: coverLetter.trim() || undefined,
        resumeUrl: profileLink.trim() || undefined,
      }),
    onSuccess: () => {
      closeSheet();
      setCoverLetter('');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      showMessage('Application sent', 'The poster was notified and can review your application.');
    },
    onError: (error) => setFormError(errorText(error, 'Your application was not sent.')),
  });

  const referralMutation = useMutation({
    mutationFn: () => {
      if (!job) throw new Error('Job not loaded');
      return createReferralRequest({
        title: `Referral for ${job.title}${job.company ? ` at ${job.company}` : ''}`.slice(0, 200),
        description: [`Profile: ${profileLink.trim()}`, note.trim()].filter(Boolean).join('\n\n'),
        category: 'jobs',
        details: `Job posting /jobs/${job.id}`,
        urgency: 'medium',
      });
    },
    onSuccess: () => {
      closeSheet();
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      showMessage('Referral request posted', 'You can track it under My referrals.');
    },
    onError: (error) => setFormError(errorText(error, 'Your request was not posted.')),
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'open' | 'closed') => updateJobPosting(String(jobId), { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
    onError: (error) => showError('Could not update the job', error),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteJobPosting(String(jobId)),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['jobs', 'detail', jobId] });
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
      router.replace('/jobs' as Href);
    },
    onError: (error) => showError('Could not delete the job', error),
  });

  if (jobQuery.isLoading) {
    return (
      <Screen>
        <BackButton fallback="/jobs" />
        <LoadingState label="Loading job…" />
      </Screen>
    );
  }

  if (jobQuery.isError || !job) {
    const notFound = (jobQuery.error as { status?: number } | null)?.status === 404;
    return (
      <Screen>
        <BackButton fallback="/jobs" />
        <ErrorState
          body={notFound ? 'This job was removed.' : errorText(jobQuery.error)}
          onRetry={notFound ? undefined : () => jobQuery.refetch()}
          retryLabel="Retry"
          title={notFound ? 'Job not found' : 'Could not load this job'}
        />
      </Screen>
    );
  }

  const isOwner = Boolean(userId && job.ownerId === userId);
  const isOpen = jobStatusIs(job, 'open');
  const salary = formatSalaryRange(job.salaryMin, job.salaryMax, { compact: false });
  const where = job.location || (job.isRemote ? 'Remote' : null);
  const externalLink =
    job.applicationUrl && LINK.test(job.applicationUrl) ? job.applicationUrl : null;

  const requireSignIn = () => {
    if (signedIn) return true;
    router.push('/sign-in' as Href);
    return false;
  };

  const openSheet = (next: Exclude<Sheet, null>) => {
    if (!requireSignIn()) return;
    setFormError(null);
    setSheet(next);
  };

  const onShare = async () => {
    try {
      const result = await shareLink(
        `/jobs/${job.id}`,
        `${job.title}${job.company ? ` at ${job.company}` : ''}`,
      );
      if (result === 'copied') showMessage('Link copied', 'The job link is on your clipboard.');
    } catch (error) {
      showError('Could not share this job', error);
    }
  };

  const onOpenSite = async () => {
    if (!externalLink) return;
    try {
      await Linking.openURL(externalLink);
    } catch (error) {
      showError('Could not open the link', error);
    }
  };

  const onDelete = async () => {
    const ok = await confirm({
      title: 'Delete this job?',
      body: 'The posting and its applications are removed for everyone. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (ok) deleteMutation.mutate();
  };

  const onToggleOpen = async () => {
    if (isOpen) {
      const ok = await confirm({
        title: 'Close this job?',
        body: 'It stops appearing in the jobs list and no one can apply. You can reopen it later.',
        confirmLabel: 'Close job',
        destructive: true,
      });
      if (!ok) return;
    }
    statusMutation.mutate(isOpen ? 'closed' : 'open');
  };

  const onSubmitApply = () => {
    const link = profileLink.trim();
    if (link && !LINK.test(link)) {
      setFormError('Use a full link starting with https://');
      return;
    }
    if (!coverLetter.trim() && !link) {
      setFormError('Add a short note or a resume/profile link.');
      return;
    }
    setFormError(null);
    applyMutation.mutate();
  };

  const onSubmitReferral = () => {
    if (!LINK.test(profileLink.trim())) {
      setFormError('Add your LinkedIn or resume link (starting with https://).');
      return;
    }
    setFormError(null);
    referralMutation.mutate();
  };

  return (
    <YStack flex={1}>
      <Screen
        bottomInset={ACTION_BAR_SPACE}
        onRefresh={() => jobQuery.refetch()}
        refreshing={jobQuery.isRefetching}
      >
        <YStack gap="$x4">
          <ScreenHeader
            actions={<IconButton icon="share" label="Share job" onPress={onShare} />}
            back={{ fallback: '/jobs' as Href }}
            title="Job"
          />
          <Card gap="$x3">
            <Heading variant="h3">{job.title}</Heading>
            <AppText tone="muted">
              {[job.company, where].filter(Boolean).join(' · ') || 'Company not listed'}
            </AppText>
            <XStack flexWrap="wrap" gap="$x2">
              <StatusBadge
                label={isOpen ? 'Open' : 'Closed'}
                tone={isOpen ? 'success' : 'warning'}
              />
              {salary ? <StatusBadge label={salary} tone="success" /> : null}
              {job.employmentType ? <StatusBadge label={job.employmentType} /> : null}
              {job.isRemote ? <StatusBadge icon="globe" label="Remote OK" tone="info" /> : null}
              {job.category?.name ? <StatusBadge label={job.category.name} tone="primary" /> : null}
            </XStack>
            <AppText tone="muted" variant="caption">
              Posted {formatRelative(job.createdAt) ?? new Date(job.createdAt).toLocaleDateString()}
              {isOwner ? ' · by you' : ''}
            </AppText>
          </Card>

          <Card gap="$x2">
            <Heading variant="h4">About the role</Heading>
            <AppText selectable>
              {job.description || 'The poster has not added a description for this role.'}
            </AppText>
          </Card>

          {isOwner ? (
            <Card gap="$x3">
              <Heading variant="h4">Manage your posting</Heading>
              <XStack flexWrap="wrap" gap="$x3">
                <AppButton
                  icon="settings"
                  label="Edit"
                  onPress={() => router.push(`/jobs/post?jobId=${job.id}` as Href)}
                  variant="secondary"
                />
                <AppButton
                  label={isOpen ? 'Close job' : 'Reopen job'}
                  loading={statusMutation.isPending}
                  onPress={onToggleOpen}
                  variant="secondary"
                />
                <AppButton
                  label="Delete"
                  loading={deleteMutation.isPending}
                  onPress={onDelete}
                  variant="danger"
                />
              </XStack>
            </Card>
          ) : null}
        </YStack>
      </Screen>

      {isOwner ? null : (
        <ActionBar label="Job actions">
          {externalLink ? (
            <AppButton label="Employer site" onPress={onOpenSite} variant="secondary" />
          ) : null}
          <AppButton
            label="Ask for referral"
            onPress={() => openSheet('referral')}
            variant="secondary"
          />
          <AppButton
            disabled={!isOpen}
            label={isOpen ? 'Apply' : 'Closed'}
            onPress={() => openSheet('apply')}
          />
        </ActionBar>
      )}

      <BottomSheet
        onClose={closeSheet}
        subtitle="The poster sees your note and link, and is notified."
        title="Apply for this job"
        visible={sheet === 'apply'}
      >
        <YStack gap="$x3">
          <TextField
            label="Short note"
            maxLength={4000}
            multiline
            numberOfLines={4}
            onChangeText={setCoverLetter}
            placeholder="Why you're a good fit"
            textAlignVertical="top"
            value={coverLetter}
          />
          <TextField
            autoCapitalize="none"
            autoCorrect={false}
            inputMode="url"
            keyboardType="url"
            label="Resume or LinkedIn link"
            maxLength={500}
            onChangeText={setProfileLink}
            placeholder="https://"
            value={profileLink}
          />
          {formError ? (
            <AppText role="alert" tone="danger">
              {formError}
            </AppText>
          ) : null}
          <AppButton
            disabled={applyMutation.isPending}
            fullWidth
            label="Send application"
            loading={applyMutation.isPending}
            onPress={onSubmitApply}
          />
        </YStack>
      </BottomSheet>

      <BottomSheet
        onClose={closeSheet}
        subtitle="Posted to the referrals board so members who can refer here can reach you."
        title="Ask for a referral"
        visible={sheet === 'referral'}
      >
        <YStack gap="$x3">
          <TextField
            autoCapitalize="none"
            autoCorrect={false}
            inputMode="url"
            keyboardType="url"
            label="LinkedIn or resume link"
            maxLength={500}
            onChangeText={setProfileLink}
            placeholder="https://"
            value={profileLink}
          />
          <TextField
            label="Note to referrers (optional)"
            maxLength={2000}
            multiline
            numberOfLines={4}
            onChangeText={setNote}
            textAlignVertical="top"
            value={note}
          />
          {formError ? (
            <AppText role="alert" tone="danger">
              {formError}
            </AppText>
          ) : null}
          <AppButton
            disabled={referralMutation.isPending}
            fullWidth
            label="Post referral request"
            loading={referralMutation.isPending}
            onPress={onSubmitReferral}
          />
        </YStack>
      </BottomSheet>
    </YStack>
  );
}
