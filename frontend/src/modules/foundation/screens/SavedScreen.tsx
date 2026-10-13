import { formatDate } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { YStack } from 'tamagui';
import { listSavedEvents } from '@/modules/events/api';
import { getSavedRides } from '@/modules/rides/api';
import { getFavorites } from '@/modules/rooms/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { Chip } from '@/modules/shared/ui/Chip';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { ListRow } from '@/modules/shared/ui/ListRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { Section } from '@/modules/shared/ui/Section';

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'rides', label: 'Rides' },
  { id: 'events', label: 'Events' },
] as const;

export function SavedScreen() {
  const [tab, setTab] = useState('all');
  const rooms = useQuery({ queryKey: ['rooms', 'favorites'], queryFn: () => getFavorites() });
  const rides = useQuery({ queryKey: ['rides', 'saved'], queryFn: () => getSavedRides() });
  const events = useQuery({ queryKey: ['events', 'saved'], queryFn: () => listSavedEvents() });
  const queries = [
    { id: 'rooms', query: rooms },
    { id: 'rides', query: rides },
    { id: 'events', query: events },
  ];
  const selected = queries.filter((item) => tab === 'all' || item.id === tab);
  const loading = selected.some((item) => item.query.isLoading);
  const failed = selected.some((item) => item.query.isError);
  const count = selected.reduce((total, item) => total + (item.query.data?.length ?? 0), 0);
  const refresh = async () => {
    await Promise.all(selected.map((item) => item.query.refetch()));
  };
  return (
    <Screen
      onRefresh={() => void refresh()}
      refreshing={selected.some((item) => item.query.isRefetching)}
    >
      <ScreenHeader
        title="Your saved finds"
        subtitle="Keep the good ones close. Pick up where you left off."
        back={{ fallback: '/profile' }}
      />
      <FilterChipRow label="Saved categories" role="radiogroup">
        {tabs.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            radio
            selected={item.id === tab}
            onPress={() => setTab(item.id)}
          />
        ))}
      </FilterChipRow>
      <Section title="More collections">
        <ListRow
          title="Saved marketplace finds"
          subtitle="Your wishlist for the next good deal"
          icon="heart"
          href="/marketplace/saved"
        />
      </Section>
      {failed ? (
        <ErrorState
          compact
          title="Some saved items couldn't load"
          body="Your available items remain below. Retry to check the rest."
          onRetry={() => void refresh()}
        />
      ) : null}
      {loading ? <LoadingState variant="skeleton" label="Loading your saved finds" /> : null}
      <YStack gap="$x5">
        {(tab === 'all' || tab === 'rooms') && rooms.data?.length ? (
          <Section title="Rooms" action={{ label: 'Browse', href: '/rooms' }}>
            {rooms.data.map((room) => (
              <ListRow
                key={room.id}
                title={room.title}
                subtitle={room.broadLocation}
                meta={`$${room.price}/mo`}
                href={`/rooms/${room.id}`}
                icon="home"
              />
            ))}
          </Section>
        ) : null}
        {(tab === 'all' || tab === 'rides') && rides.data?.length ? (
          <Section title="Rides" action={{ label: 'Browse', href: '/rides' }}>
            {rides.data.map((ride) => (
              <ListRow
                key={ride.id}
                title={ride.routeLabel}
                subtitle={`Departs ${formatDate(ride.departureAt, 'weekdayTime') ?? ''}`}
                meta={ride.contributionLabel}
                href={`/rides/${ride.id}`}
                icon="car"
                tone="teal"
              />
            ))}
          </Section>
        ) : null}
        {(tab === 'all' || tab === 'events') && events.data?.length ? (
          <Section title="Events" action={{ label: 'Browse', href: '/events' }}>
            {events.data.map((event) => (
              <ListRow
                key={event.id}
                title={event.title}
                subtitle={[event.location, formatDate(event.startAt ?? event.date, 'weekdayTime')]
                  .filter(Boolean)
                  .join(' · ')}
                href={`/events/${event.id}`}
                icon="calendar"
                tone="warm"
              />
            ))}
          </Section>
        ) : null}
      </YStack>
      {!failed && !loading && count === 0 ? (
        <EmptyState
          title="Your next favorite is out there"
          body="Tap the heart on a room, ride, or event to find it here later."
          iconName="heart"
          actionLabel="Explore features"
          onAction={() => router.push('/explore')}
        />
      ) : null}
    </Screen>
  );
}
