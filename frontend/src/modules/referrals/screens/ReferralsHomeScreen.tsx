import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { XStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { getMyReferrals, listPublicReferrals } from '@/modules/referrals/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { EditorialBanner } from '@/modules/shared/ui/EditorialBanner';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { Section } from '@/modules/shared/ui/Section';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';
import { TextField } from '@/modules/shared/ui/TextField';

type TabType = 'offers' | 'requests';

const FILTER_CHIPS = [
  { id: 'all', label: 'All Referrals', icon: 'compass' },
  { id: 'jobs', label: 'Job Referrals', icon: 'briefcase' },
  { id: 'legal', label: 'Immigration Legal', icon: 'shield' },
  { id: 'skills', label: 'Skill Swap', icon: 'sparks' },
  { id: 'housing', label: 'Housing Help', icon: 'home' },
] as const;

/** `/referrals` lists public referrals; `/referrals/mine` lists the signed-in user's own (`GET /api/v1/referrals`). */
export function ReferralsScreen({ screenId = 'home' }: { screenId?: 'home' | 'mine' }) {
  const isMine = screenId === 'mine';
  const router = useRouter();
  const signedIn = useAuthStore((state) => state.status === 'authenticated');

  const [activeTab, setActiveTab] = useState<TabType>('offers');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: rawReferrals,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['referrals', isMine ? 'mine' : 'public'],
    queryFn: isMine ? getMyReferrals : listPublicReferrals,
    enabled: !isMine || signedIn,
  });

  const allReferrals = rawReferrals ?? [];

  const offers = useMemo(
    () => allReferrals.filter((r) => r.type?.toLowerCase() === 'offer'),
    [allReferrals],
  );
  const requests = useMemo(
    () => allReferrals.filter((r) => r.type?.toLowerCase() === 'request'),
    [allReferrals],
  );

  const displayedItems = useMemo(() => {
    const list = activeTab === 'offers' ? offers : requests;
    return list.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (selectedFilter === 'jobs') {
        matchesFilter =
          item.title.toLowerCase().includes('engineer') ||
          item.title.toLowerCase().includes('manager') ||
          item.title.toLowerCase().includes('scientist') ||
          (item.category?.toLowerCase().includes('tech') ?? false);
      } else if (selectedFilter === 'legal') {
        matchesFilter =
          item.title.toLowerCase().includes('attorney') ||
          item.title.toLowerCase().includes('eb-2') ||
          item.description.toLowerCase().includes('immigration');
      } else if (selectedFilter === 'skills') {
        matchesFilter =
          item.title.toLowerCase().includes('skill') ||
          item.description.toLowerCase().includes('review');
      } else if (selectedFilter === 'housing') {
        matchesFilter =
          item.title.toLowerCase().includes('housing') ||
          item.description.toLowerCase().includes('room');
      }

      return matchesSearch && matchesFilter;
    });
  }, [activeTab, offers, requests, searchQuery, selectedFilter]);

  const go = (route: '/referrals/offer' | '/referrals/request') =>
    router.push(signedIn ? route : '/sign-in');
  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <ScreenHeader
        title={isMine ? 'My referrals' : 'Referrals'}
        subtitle="Good people open good doors."
        back={{ fallback: '/explore' }}
        actions={
          !isMine ? (
            <IconButton
              icon="user"
              label="My referrals"
              onPress={() => router.push(signedIn ? '/referrals/mine' : '/sign-in')}
              variant="plain"
            />
          ) : undefined
        }
        primaryAction={{ label: 'Offer help', icon: 'plus', onPress: () => go('/referrals/offer') }}
      />
      {!isMine && !searchQuery && selectedFilter === 'all' ? (
        <EditorialBanner
          density="compact"
          eyebrow="CONNECTIONS THAT COUNT"
          title="One introduction. New possibilities."
          kind="referrals"
        />
      ) : null}
      <XStack flexWrap="wrap" gap="$x2">
        <AppButton
          label="Request a referral"
          size="sm"
          variant="secondary"
          onPress={() => go('/referrals/request')}
        />
        <AppButton
          label="Offer a referral"
          size="sm"
          variant="ghost"
          onPress={() => go('/referrals/offer')}
        />
      </XStack>
      <TextField
        leadingIcon="search"
        aria-label="Search referrals"
        placeholder="Search roles, skills, or help"
        value={searchQuery}
        onChangeText={setSearchQuery}
        trailing={
          searchQuery ? (
            <IconButton
              icon="close"
              label="Clear referral search"
              onPress={() => setSearchQuery('')}
              variant="plain"
            />
          ) : undefined
        }
      />
      <SegmentedControl<TabType>
        label="Referral type"
        value={activeTab}
        onChange={setActiveTab}
        options={[
          { value: 'offers', label: 'Offers', count: offers.length },
          { value: 'requests', label: 'Requests', count: requests.length },
        ]}
      />
      <FilterChipRow label="Referral categories" role="radiogroup">
        {FILTER_CHIPS.map((category) => (
          <Chip
            key={category.id}
            label={category.label}
            icon={category.icon}
            radio
            selected={selectedFilter === category.id}
            onPress={() => setSelectedFilter(category.id)}
          />
        ))}
      </FilterChipRow>
      <Section title={activeTab === 'offers' ? 'People ready to help' : 'Ways you can help'}>
        {isMine && !signedIn ? (
          <EmptyState
            iconName="user"
            title="Your connections, in one place"
            body="Sign in to view your own referral requests and offers."
            actionLabel="Sign in"
            onAction={() => router.push('/sign-in')}
          />
        ) : isLoading ? (
          <LoadingState variant="skeleton" />
        ) : isError ? (
          <ErrorState
            title="Referrals couldn't load"
            body="Try again when your connection is ready."
            onRetry={() => void refetch()}
          />
        ) : displayedItems.length === 0 ? (
          <EmptyState
            iconName="handshake"
            title="No matching referrals yet"
            body="Try another category, or start a new connection."
            actionLabel="Clear filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedFilter('all');
            }}
          />
        ) : (
          <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2, wide: 3 }}>
            {displayedItems.map((item) => (
              <Card
                key={item.id}
                flexGrow={1}
                gap="$x4"
                href={`/referrals/${item.id}`}
                aria-label={`View ${item.title}`}
              >
                <XStack gap="$x2" flexWrap="wrap">
                  {item.category ? <Chip label={item.category} variant="tag" /> : null}
                  {item.status ? <StatusBadge label={item.status} tone="neutral" /> : null}
                </XStack>
                <AppText variant="h3">{item.title}</AppText>
                {item.description ? (
                  <AppText tone="muted" numberOfLines={4}>
                    {item.description}
                  </AppText>
                ) : null}
                <AppText tone="primary" variant="label">
                  View details →
                </AppText>
              </Card>
            ))}
          </ResponsiveGrid>
        )}
      </Section>
    </Screen>
  );
}
