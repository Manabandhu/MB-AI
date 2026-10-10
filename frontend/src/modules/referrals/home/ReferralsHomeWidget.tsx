import { formatRelative } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { persistMeta } from '@/lib/queryPersistence';
import { WidgetFrame } from '@/modules/shared/components/WidgetFrame';
import { ListRow } from '@/modules/shared/ui/ListRow';
import { listPublicReferrals } from '../api';

/** Latest public referral requests and offers. */
export function ReferralsHomeWidget() {
  const query = useQuery({
    queryKey: ['referrals', 'home-widget'],
    queryFn: listPublicReferrals,
    staleTime: 60_000,
    meta: persistMeta,
  });
  const referrals = (query.data ?? []).slice(0, 3);
  return (
    <WidgetFrame
      empty={{
        title: 'No referrals yet',
        body: 'Ask for a referral or offer one at your company.',
        actionLabel: 'Request a referral',
        actionHref: '/referrals/request',
      }}
      icon="handshake"
      isEmpty={referrals.length === 0}
      isError={query.isError}
      isLoading={query.isLoading}
      onRetry={() => query.refetch()}
      seeAll={{ href: '/referrals' }}
      title="Referrals"
    >
      {referrals.map((referral) => (
        <ListRow
          href={`/referrals/${referral.id}`}
          icon={referral.type === 'offer' ? 'handshake' : 'help'}
          key={referral.id}
          meta={formatRelative(referral.createdAt)}
          subtitle={[referral.type === 'offer' ? 'Offering' : 'Requesting', referral.category]
            .filter(Boolean)
            .join(' · ')}
          title={referral.title}
          tone="teal"
        />
      ))}
    </WidgetFrame>
  );
}
