import { useQuery } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { getMyReferrals, listPublicReferrals } from '@/modules/referrals/api';
import { ReferralCard } from '@/modules/referrals/components/ReferralCard';
import { matchesReferral, referralCategories } from '@/modules/referrals/utils/referralStatus';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { Chip } from '@/modules/shared/ui/Chip';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { errorText } from '@/modules/shared/ui/notify';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { TextField } from '@/modules/shared/ui/TextField';

type Tab = 'offer' | 'request';

/** `/referrals` lists open public referrals; `/referrals/mine` lists the signed-in user's own (`GET /api/v1/referrals`). */
export function ReferralsScreen({ screenId = 'home' }: { screenId?: 'home' | 'mine' }) {
  const isMine = screenId === 'mine';
  const router = useRouter();
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const [tab, setTab] = useState<Tab>('offer');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const referralsQuery = useQuery({
    queryKey: ['referrals', isMine ? 'mine' : 'public'],
    queryFn: isMine ? getMyReferrals : listPublicReferrals,
    enabled: !isMine || signedIn,
  });
  const all = referralsQuery.data ?? [];
  const ofType = useMemo(() => all.filter((r) => r.type === tab), [all, tab]);
  const categories = useMemo(() => referralCategories(ofType), [ofType]);
  const shown = useMemo(
    () => ofType.filter((r) => matchesReferral(r, query, category)),
    [ofType, query, category],
  );
  const count = (type: Tab) => all.filter((r) => r.type === type).length;

  const go = (path: string) => router.push((signedIn ? path : '/sign-in') as Href);

  const body = () => {
    if (referralsQuery.isLoading || (isMine && !signedIn)) {
      return <LoadingState count={3} label="Loading referrals…" variant="skeleton" />;
    }
    if (referralsQuery.isError) {
      return (
        <ErrorState
          body={errorText(referralsQuery.error)}
          onRetry={() => referralsQuery.refetch()}
          retryLabel="Retry"
          title="Could not load referrals"
        />
      );
    }
    if (ofType.length === 0) {
      return (
        <EmptyState
          actionLabel={tab === 'offer' ? 'Offer a referral' : 'Request a referral'}
          body={
            isMine
              ? `Referral ${tab === 'offer' ? 'offers' : 'requests'} you post appear here.`
              : `No open referral ${tab === 'offer' ? 'offers' : 'requests'} right now.`
          }
          iconName="handshake"
          onAction={() => go(tab === 'offer' ? '/referrals/offer' : '/referrals/request')}
          title={tab === 'offer' ? 'No offers yet' : 'No requests yet'}
        />
      );
    }
    if (shown.length === 0) {
      return (
        <EmptyState
          actionLabel="Clear filters"
          body="Try a different search or category."
          onAction={() => {
            setQuery('');
            setCategory(null);
          }}
          title="No matches"
        />
      );
    }
    return (
      <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2, wide: 3 }} gap={12}>
        {shown.map((referral) => (
          <ReferralCard key={referral.id} mine={isMine} referral={referral} />
        ))}
      </ResponsiveGrid>
    );
  };

  return (
    <Screen onRefresh={() => referralsQuery.refetch()} refreshing={referralsQuery.isRefetching}>
      <YStack gap="$x4">
        <ScreenHeader
          actions={
            isMine ? null : (
              <IconButton icon="user" label="My referrals" onPress={() => go('/referrals/mine')} />
            )
          }
          back={isMine ? { fallback: '/referrals' as Href } : false}
          subtitle={
            isMine
              ? 'Offers and requests you posted'
              : 'Members offering and asking for referrals. Referrals here are always free.'
          }
          title={isMine ? 'My referrals' : 'Referrals'}
        />
        <XStack flexWrap="wrap" gap="$x3">
          <AppButton icon="plus" label="Offer a referral" onPress={() => go('/referrals/offer')} />
          <AppButton
            icon="mail"
            label="Request a referral"
            onPress={() => go('/referrals/request')}
            variant="secondary"
          />
        </XStack>
        <SegmentedControl
          label="Referral type"
          onChange={(value: Tab) => {
            setTab(value);
            setCategory(null);
          }}
          options={[
            {
              value: 'offer',
              label: 'Offers',
              count: referralsQuery.data ? count('offer') : undefined,
            },
            {
              value: 'request',
              label: 'Requests',
              count: referralsQuery.data ? count('request') : undefined,
            },
          ]}
          value={tab}
        />
        <TextField
          accessibilityLabel="Search referrals"
          leadingIcon="search"
          onChangeText={setQuery}
          placeholder="Company, role, or skill"
          returnKeyType="search"
          value={query}
        />
        {categories.length > 0 ? (
          <FilterChipRow label="Category" role="radiogroup">
            <Chip label="All" onPress={() => setCategory(null)} radio selected={!category} />
            {categories.map((c) => (
              <Chip
                key={c}
                label={c}
                onPress={() => setCategory(c)}
                radio
                selected={category?.toLowerCase() === c.toLowerCase()}
              />
            ))}
          </FilterChipRow>
        ) : null}
        {body()}
      </YStack>
    </Screen>
  );
}
