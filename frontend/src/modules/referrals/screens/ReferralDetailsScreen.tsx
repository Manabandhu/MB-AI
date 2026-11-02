import { formatRelative } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import {
  contactReferral,
  getReferralDetail,
  getReferralOffer,
  getReferralRequest,
  updateReferralStatus,
} from '@/modules/referrals/api';
import {
  isOpenReferral,
  REFERRALS_KEY,
  referralStatusLabel,
  referralStatusTone,
} from '@/modules/referrals/utils/referralStatus';
import { ACTION_BAR_SPACE, ActionBar } from '@/modules/shared/ui/ActionBar';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Card } from '@/modules/shared/ui/Card';
import { useConfirm } from '@/modules/shared/ui/ConfirmSheet';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { errorText, showError } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';
import { TextField } from '@/modules/shared/ui/TextField';

const PITCH_MIN = 20;

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <YStack gap={2}>
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
      <AppText selectable>{value}</AppText>
    </YStack>
  );
}

/**
 * One referral. Members message the poster in chat with a short pitch (the server reuses or opens one direct chat); the
 * poster closes or reopens it instead.
 */
export function ReferralDetailsScreen() {
  const { referralId } = useLocalSearchParams<{ referralId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.user?.id);
  const signedIn = authStatus === 'authenticated';
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pitch, setPitch] = useState('');
  const [pitchError, setPitchError] = useState<string | null>(null);

  const referralQuery = useQuery({
    queryKey: ['referrals', 'detail', referralId],
    queryFn: () => getReferralDetail(referralId),
    // Referral details are for members; signed-out visitors are asked to sign in instead of seeing an error.
    enabled: Boolean(referralId) && signedIn,
  });
  const referral = referralQuery.data;
  const offerQuery = useQuery({
    queryKey: ['referrals', 'offer', referralId],
    queryFn: () => getReferralOffer(referralId),
    enabled: Boolean(referralId && referral?.type === 'offer'),
  });
  const requestQuery = useQuery({
    queryKey: ['referrals', 'request', referralId],
    queryFn: () => getReferralRequest(referralId),
    enabled: Boolean(referralId && referral?.type === 'request'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'open' | 'closed') => updateReferralStatus(referralId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REFERRALS_KEY }),
    onError: (error) => showError('Could not update the referral', error),
  });

  const contactMutation = useMutation({
    mutationFn: (message: string) => contactReferral(referralId, message),
    onSuccess: ({ conversationId }) => {
      setSheetOpen(false);
      setPitch('');
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      router.push(`/chat/${conversationId}` as Href);
    },
    onError: (error) => setPitchError(errorText(error, 'Your message was not sent.')),
  });

  if (authStatus === 'unauthenticated') {
    return (
      <Screen>
        <BackButton fallback="/referrals" />
        <ErrorState
          actionIcon={null}
          body="Referral details are available to signed-in ManaBandhu members."
          onRetry={() => router.push('/sign-in' as Href)}
          retryLabel="Sign in"
          title="Sign in to view this referral"
        />
      </Screen>
    );
  }

  if (authStatus === 'loading' || referralQuery.isLoading) {
    return (
      <Screen>
        <BackButton fallback="/referrals" />
        <LoadingState label="Loading referral…" />
      </Screen>
    );
  }

  if (referralQuery.isError || !referral) {
    const notFound = (referralQuery.error as { status?: number } | null)?.status === 404;
    return (
      <Screen>
        <BackButton fallback="/referrals" />
        <ErrorState
          body={
            notFound
              ? 'This referral was removed or is no longer open.'
              : errorText(referralQuery.error)
          }
          onRetry={notFound ? undefined : () => referralQuery.refetch()}
          retryLabel="Retry"
          title={notFound ? 'Referral not found' : 'Could not load this referral'}
        />
      </Screen>
    );
  }

  const isOwner = Boolean(userId && referral.ownerId === userId);
  const open = isOpenReferral(referral);
  const offer = offerQuery.data;
  const request = requestQuery.data;
  const detailsError = offerQuery.error ?? requestQuery.error;

  const onToggleStatus = async () => {
    if (open) {
      const ok = await confirm({
        title: 'Close this referral?',
        body: 'It leaves the public board. You can reopen it later.',
        confirmLabel: 'Close',
        destructive: true,
      });
      if (!ok) return;
    }
    statusMutation.mutate(open ? 'closed' : 'open');
  };

  const onSend = () => {
    const text = pitch.trim();
    if (text.length < PITCH_MIN) {
      setPitchError(
        `Write at least ${PITCH_MIN} characters: who you are and what you're looking for.`,
      );
      return;
    }
    setPitchError(null);
    contactMutation.mutate(text);
  };

  return (
    <YStack flex={1}>
      <Screen
        bottomInset={isOwner || !open ? 0 : ACTION_BAR_SPACE}
        onRefresh={() =>
          Promise.all([referralQuery.refetch(), offerQuery.refetch(), requestQuery.refetch()])
        }
        refreshing={referralQuery.isRefetching}
      >
        <YStack gap="$x4">
          <ScreenHeader
            back={{ fallback: '/referrals' as Href }}
            title={referral.type === 'offer' ? 'Referral offer' : 'Referral request'}
          />
          <Card gap="$x3">
            <Heading variant="h3">{referral.title}</Heading>
            <XStack flexWrap="wrap" gap="$x2">
              <StatusBadge
                label={referralStatusLabel(referral.status)}
                tone={referralStatusTone(referral.status)}
              />
              {referral.category ? <StatusBadge label={referral.category} /> : null}
              {offer?.serviceType ? <StatusBadge label={offer.serviceType} tone="primary" /> : null}
              {request?.urgency ? (
                <StatusBadge
                  label={`${request.urgency.charAt(0).toUpperCase()}${request.urgency.slice(1)} urgency`}
                  tone={request.urgency.toLowerCase() === 'high' ? 'warning' : 'info'}
                />
              ) : null}
            </XStack>
            <AppText tone="muted" variant="caption">
              {isOwner ? 'Posted by you' : 'Posted by a member'} ·{' '}
              {formatRelative(referral.createdAt) ?? ''}
            </AppText>
          </Card>

          <Card gap="$x3">
            <DetailRow label="Details" value={referral.description} />
            <DetailRow label="Availability" value={offer?.availability} />
            <DetailRow label="Terms" value={offer?.terms} />
            <DetailRow label="More about the request" value={request?.details} />
            <DetailRow label="Hoping for" value={request?.desiredOutcome} />
            {isOwner ? <DetailRow label="Your contact info" value={referral.contactInfo} /> : null}
            {detailsError ? (
              <AppText tone="danger" variant="caption">
                Some details could not load: {errorText(detailsError)}
              </AppText>
            ) : null}
            {!referral.description && !offer && !request && !detailsError ? (
              <AppText tone="muted">No further details were added.</AppText>
            ) : null}
          </Card>

          <Card gap="$x1" variant="filled">
            <AppText variant="label">Referrals are free</AppText>
            <AppText tone="muted" variant="caption">
              Never pay for a referral. If someone asks for money, report them from Safety.
            </AppText>
          </Card>

          {isOwner ? (
            <Card gap="$x3">
              <Heading variant="h4">Manage</Heading>
              <AppText tone="muted">
                {open
                  ? 'Close it when you have found someone, so members stop reaching out.'
                  : 'This referral is closed and hidden from the board.'}
              </AppText>
              <XStack>
                <AppButton
                  label={open ? 'Close referral' : 'Reopen referral'}
                  loading={statusMutation.isPending}
                  onPress={onToggleStatus}
                  variant={open ? 'danger' : 'secondary'}
                />
              </XStack>
            </Card>
          ) : null}
        </YStack>
      </Screen>

      {!isOwner && open ? (
        <ActionBar label="Referral actions">
          <AppButton
            icon="message"
            label={referral.type === 'offer' ? 'Request introduction' : 'Offer to help'}
            onPress={() => {
              setPitchError(null);
              setSheetOpen(true);
            }}
          />
        </ActionBar>
      ) : null}

      <BottomSheet
        onClose={() => setSheetOpen(false)}
        subtitle="Sends this to the poster in your private chat with them."
        title={referral.type === 'offer' ? 'Request introduction' : 'Offer to help'}
        visible={sheetOpen}
      >
        <YStack gap="$x3">
          <TextField
            error={pitchError}
            label="Your message"
            maxLength={2000}
            multiline
            numberOfLines={5}
            onChangeText={setPitch}
            placeholder={
              referral.type === 'offer'
                ? 'Your background, the role or job ID, and a link to your resume or LinkedIn'
                : 'How you can help and where you can refer'
            }
            textAlignVertical="top"
            value={pitch}
          />
          <AppButton
            disabled={contactMutation.isPending}
            fullWidth
            label="Send message"
            loading={contactMutation.isPending}
            onPress={onSend}
          />
        </YStack>
      </BottomSheet>
    </YStack>
  );
}
