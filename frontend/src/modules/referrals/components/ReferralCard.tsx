import { formatRelative } from '@manabandhu/core';
import type { Href } from 'expo-router';
import { XStack } from 'tamagui';
import type { Referral } from '@/modules/referrals/api';
import { referralStatusLabel, referralStatusTone } from '@/modules/referrals/utils/referralStatus';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

/** A referral offer or request in a list. Opens the referral. */
export function ReferralCard({ referral, mine }: { referral: Referral; mine?: boolean }) {
  return (
    <Card aria-label={referral.title} href={`/referrals/${referral.id}` as Href}>
      <Heading numberOfLines={2} variant="h4">
        {referral.title}
      </Heading>
      {referral.description ? (
        <AppText numberOfLines={3} tone="muted">
          {referral.description}
        </AppText>
      ) : null}
      <XStack alignItems="center" flexWrap="wrap" gap="$x2">
        <StatusBadge
          label={referral.type === 'offer' ? 'Offer' : 'Request'}
          tone={referral.type === 'offer' ? 'primary' : 'info'}
        />
        <StatusBadge
          label={referralStatusLabel(referral.status)}
          tone={referralStatusTone(referral.status)}
        />
        {referral.category ? <StatusBadge label={referral.category} /> : null}
      </XStack>
      <AppText tone="muted" variant="caption">
        {mine ? 'Posted by you' : 'Posted by a member'} · {formatRelative(referral.createdAt) ?? ''}
      </AppText>
    </Card>
  );
}
