import { formatDate } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useState } from 'react';
import { YStack } from 'tamagui';
import { type Event, listSavedEvents } from '@/modules/events';
import { formatListingPrice } from '@/modules/marketplace';
import { getSavedRides, type Ride } from '@/modules/rides';
import { getFavorites, type RoomListing } from '@/modules/rooms';
import {
  type AppIconName,
  Card,
  ListRow,
  Screen,
  ScreenHeader,
  Section,
  SegmentedControl,
  SkeletonCard,
} from '@/modules/shared/ui';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';

type TabId = 'all' | 'rooms' | 'rides' | 'events';

type Group = {
  id: Exclude<TabId, 'all'>;
  title: string;
  emptyTitle: string;
  emptyBody: string;
  exploreLabel: string;
  exploreRoute: string;
  icon: AppIconName;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  rows: { id: string; title: string; subtitle: string; meta?: string | null; href: string }[];
};

function eventSubtitle(e: Event) {
  const when = formatDate(e.startAt) ?? '';
  return [e.location, when].filter(Boolean).join(' · ');
}

/**
 * The member's own saved rooms, rides, and events. Each section loads and fails on its own, and each tab has its
 * own empty state pointing to where to find things to save.
 */
export function SavedScreen() {
  const [activeTab, setActiveTab] = useState<TabId>('all');

  // Only the caller's own saved items from the backend; failures are shown, never replaced with other listings.
  const roomsQuery = useQuery<RoomListing[]>({
    queryKey: ['rooms', 'favorites'],
    queryFn: () => getFavorites(),
  });
  const ridesQuery = useQuery<Ride[]>({
    queryKey: ['rides', 'saved'],
    queryFn: () => getSavedRides(),
  });
  const eventsQuery = useQuery<Event[]>({
    queryKey: ['events', 'saved'],
    queryFn: () => listSavedEvents(),
  });

  const groups: Group[] = [
    {
      id: 'rooms',
      title: 'Rooms',
      emptyTitle: 'No saved rooms',
      emptyBody: 'Tap the heart on a room listing to keep it here.',
      exploreLabel: 'Browse rooms',
      exploreRoute: '/rooms',
      icon: 'bed',
      isLoading: roomsQuery.isLoading,
      isError: roomsQuery.isError,
      refetch: () => void roomsQuery.refetch(),
      rows: (roomsQuery.data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: [r.broadLocation, `${formatListingPrice(r.price)}/mo`]
          .filter(Boolean)
          .join(' · '),
        href: `/rooms/${r.id}`,
      })),
    },
    {
      id: 'rides',
      title: 'Rides',
      emptyTitle: 'No saved rides',
      emptyBody: 'Save a ride to come back to it before it departs.',
      exploreLabel: 'Find a ride',
      exploreRoute: '/rides',
      icon: 'car',
      isLoading: ridesQuery.isLoading,
      isError: ridesQuery.isError,
      refetch: () => void ridesQuery.refetch(),
      rows: (ridesQuery.data ?? []).map((ride) => ({
        id: ride.id,
        title: ride.routeLabel,
        subtitle: `Departs ${formatDate(ride.departureAt, 'weekdayTime') ?? ''}`,
        meta: ride.contributionLabel,
        href: `/rides/${ride.id}`,
      })),
    },
    {
      id: 'events',
      title: 'Events',
      emptyTitle: 'No saved events',
      emptyBody: 'Save events you are interested in to find them quickly.',
      exploreLabel: 'Browse events',
      exploreRoute: '/events',
      icon: 'event',
      isLoading: eventsQuery.isLoading,
      isError: eventsQuery.isError,
      refetch: () => void eventsQuery.refetch(),
      rows: (eventsQuery.data ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        subtitle: eventSubtitle(e),
        href: `/events/${e.id}`,
      })),
    },
  ];

  const settled = groups.every((g) => !g.isLoading);
  const total = groups.reduce((sum, g) => sum + g.rows.length, 0);
  const anyFailed = groups.some((g) => g.isError);
  const visible = groups.filter((g) => activeTab === 'all' || activeTab === g.id);
  const allEmpty = settled && !anyFailed && total === 0;

  const tone = (id: Group['id']) =>
    id === 'rides' ? 'teal' : id === 'events' ? 'warm' : 'primary';

  return (
    <Screen
      onRefresh={() => {
        for (const g of groups) g.refetch();
      }}
      refreshing={roomsQuery.isRefetching || ridesQuery.isRefetching || eventsQuery.isRefetching}
    >
      <ScreenHeader
        back={{ fallback: '/profile' as Href }}
        subtitle={
          settled && !anyFailed ? `${total} saved ${total === 1 ? 'item' : 'items'}` : undefined
        }
        title="Saved"
      />
      <SegmentedControl
        label="Saved item type"
        onChange={setActiveTab}
        options={[
          { value: 'all', label: 'All' },
          ...groups.map((g) => ({
            value: g.id,
            label: g.title,
            count: g.isLoading || g.isError ? undefined : g.rows.length,
          })),
        ]}
        value={activeTab}
      />

      {activeTab === 'all' && allEmpty ? (
        <EmptyState
          body="Save rooms, rides, and events while you browse and they will show up here."
          iconName="bookmark"
          onAction={() => router.push('/explore' as Href)}
          actionLabel="Explore ManaBandhu"
          title="Nothing saved yet"
        />
      ) : (
        visible.map((group) => {
          // On "All", empty sections are skipped; on a single tab they get their own empty state.
          if (activeTab === 'all' && !group.isLoading && !group.isError && group.rows.length === 0)
            return null;
          return (
            <Section
              action={
                group.rows.length > 0
                  ? { label: group.exploreLabel, href: group.exploreRoute }
                  : undefined
              }
              key={group.id}
              title={group.title}
            >
              {group.isLoading ? (
                <SkeletonCard lines={2} />
              ) : group.isError ? (
                <Card variant="filled">
                  <ErrorState
                    body="Your other saved items are still shown."
                    compact
                    onRetry={group.refetch}
                    title={`Saved ${group.title.toLowerCase()} couldn't load`}
                  />
                </Card>
              ) : group.rows.length === 0 ? (
                <EmptyState
                  body={group.emptyBody}
                  compact
                  iconName={group.icon}
                  onAction={() => router.push(group.exploreRoute as Href)}
                  actionLabel={group.exploreLabel}
                  title={group.emptyTitle}
                />
              ) : (
                <YStack gap="$x2">
                  {group.rows.map((row) => (
                    <ListRow
                      href={row.href}
                      icon={group.icon}
                      key={row.id}
                      meta={row.meta}
                      subtitle={row.subtitle}
                      title={row.title}
                      tone={tone(group.id)}
                    />
                  ))}
                </YStack>
              )}
            </Section>
          );
        })
      )}
    </Screen>
  );
}
