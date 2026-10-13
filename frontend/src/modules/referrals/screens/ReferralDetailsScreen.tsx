import { formatDate } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { getReferralDetail, getReferralOffer, getReferralRequest } from '@/modules/referrals/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ACTION_BAR_SPACE, ActionBar } from '@/modules/shared/ui/ActionBar';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { EditorialBanner } from '@/modules/shared/ui/EditorialBanner';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { Section } from '@/modules/shared/ui/Section';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

/** Server-provided referral facts and real creation routes, without a simulated introduction success. */
export function ReferralDetailsScreen() {
  const { referralId } = useLocalSearchParams<{ referralId: string }>();
  const authStatus = useAuthStore((state) => state.status);
  const signedIn = authStatus === 'authenticated';
  const detail = useQuery({
    queryKey: ['referrals', 'detail', referralId],
    queryFn: () => getReferralDetail(referralId),
    enabled: Boolean(referralId) && signedIn,
  });
  const referral = detail.data;
  const offer = useQuery({
    queryKey: ['referrals', 'offer', referralId],
    queryFn: () => getReferralOffer(referralId),
    enabled: Boolean(referralId) && signedIn && referral?.type === 'offer',
  });
  const request = useQuery({
    queryKey: ['referrals', 'request', referralId],
    queryFn: () => getReferralRequest(referralId),
    enabled: Boolean(referralId) && signedIn && referral?.type === 'request',
  });
  if (signedIn && !referralId)
    return (
      <Screen>
        <ScreenHeader title="Referral details" back={{ fallback: '/referrals' }} />
        <ErrorState
          title="Referral not available"
          body="Open a referral from the directory to continue."
        />
      </Screen>
    );
  if (!signedIn || detail.isPending || detail.isError || !referral)
    return (
      <Screen maxWidth="form">
        <ScreenHeader title="Referral details" back={{ fallback: '/referrals' }} />
        {authStatus === 'unauthenticated' ? (
          <Card>
            <AppText variant="h3">Make your next connection.</AppText>
            <AppText tone="muted">
              Sign in to view referral details and member contact information.
            </AppText>
            <AppButton label="Sign in" route="/sign-in" />
          </Card>
        ) : authStatus === 'loading' || detail.isPending ? (
          <LoadingState />
        ) : (
          <ErrorState
            title="This referral couldn't load"
            body="It may no longer be available. Retry to check."
            onRetry={() => void detail.refetch()}
          />
        )}
      </Screen>
    );
  const extra = referral.type === 'offer' ? offer : request;
  return (
    <YStack flex={1} backgroundColor="$background">
      <Screen
        bottomInset={ACTION_BAR_SPACE}
        onRefresh={() => {
          void detail.refetch();
          void extra.refetch();
        }}
        refreshing={detail.isRefetching || extra.isRefetching}
      >
        <ScreenHeader title="Referral details" back={{ fallback: '/referrals' }} />
        <EditorialBanner
          eyebrow={referral.type === 'offer' ? 'AN OPEN DOOR' : 'A CONNECTION IN THE MAKING'}
          title={referral.title}
          kind="referrals"
        />
        <XStack gap="$x2" flexWrap="wrap">
          {referral.status ? <StatusBadge label={referral.status} tone="neutral" /> : null}
          {referral.category ? <Chip label={referral.category} variant="tag" /> : null}
        </XStack>
        <Section title="About this connection">
          <Card>
            <AppText>{referral.description}</AppText>
            {referral.createdAt ? (
              <AppText tone="muted" variant="caption">
                Posted {formatDate(referral.createdAt, 'short')}
              </AppText>
            ) : null}
          </Card>
        </Section>
        {extra.isPending ? (
          <LoadingState count={1} variant="skeleton" />
        ) : extra.isError ? (
          <ErrorState
            compact
            title="Additional details couldn't load"
            body="The referral is available above. Retry to see the remaining details."
            onRetry={() => void extra.refetch()}
          />
        ) : (
          <>
            {offer.data ? (
              <Section title="The offer">
                <Card gap="$x4">
                  <Detail label="Type of help" value={offer.data.serviceType} />
                  <Detail label="Availability" value={offer.data.availability} />
                  <Detail label="Terms" value={offer.data.terms} />
                  <Detail label="Expires" value={formatDate(offer.data.expiresAt, 'short')} />
                </Card>
              </Section>
            ) : null}
            {request.data ? (
              <Section title="What they're looking for">
                <Card gap="$x4">
                  <Detail label="Details" value={request.data.details} />
                  <Detail label="Urgency" value={request.data.urgency} />
                  <Detail label="Desired outcome" value={request.data.desiredOutcome} />
                </Card>
              </Section>
            ) : null}
          </>
        )}
        {referral.contactInfo ? (
          <Section title="Contact information">
            <Card>
              <AppText>{referral.contactInfo}</AppText>
            </Card>
          </Section>
        ) : null}
        <Card variant="filled">
          <AppText variant="h4">A thoughtful introduction starts here.</AppText>
          <AppText tone="muted">
            Create your own request or offer with the details people need. Check the terms and who
            you're sharing information with.
          </AppText>
        </Card>
      </Screen>
      <ActionBar>
        <AppButton label="Create a request" route="/referrals/request" />
        <AppButton label="Offer help" route="/referrals/offer" variant="secondary" />
      </ActionBar>
    </YStack>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <YStack gap="$x1">
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </YStack>
  );
}
