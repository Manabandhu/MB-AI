import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  archiveRoomListing,
  getFavorites,
  getMyListings,
  pauseRoomListing,
  publishRoomListing,
  unsaveRoom,
} from '@/modules/rooms/api';
import type { RoomListing } from '@/modules/rooms/types';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

export function RoomFavoritesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rooms', 'favorites'],
    queryFn: getFavorites,
  });

  const unsave = useMutation({
    mutationFn: (roomId: string) => unsaveRoom(roomId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', 'favorites'] }),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load saved rooms"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <SectionHeader title="Saved rooms" subtitle="Listings you saved for later." />
          {data && data.length > 0 ? (
            data.map((room) => (
              <RoomCard key={room.id} room={room} onUnsave={() => unsave.mutate(room.id)} />
            ))
          ) : (
            <EmptyState
              title="No saved rooms yet"
              body="Save published listings to compare them here."
              actionLabel="Browse rooms"
              onAction={() => router.push('/rooms/search')}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function RoomMyListingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rooms', 'my-listings'],
    queryFn: getMyListings,
  });

  const listings = data ?? [];

  const publish = useMutation({
    mutationFn: publishRoomListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', 'my-listings'] }),
  });

  const pause = useMutation({
    mutationFn: pauseRoomListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', 'my-listings'] }),
  });

  const archive = useMutation({
    mutationFn: archiveRoomListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', 'my-listings'] }),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load your listings"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <SectionHeader title="My listings" subtitle="Manage your posted rooms." />
          {listings.length > 0 ? (
            listings.map((listing) => (
              <View key={listing.id} style={styles.card}>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{listing.title}</Text>
                  <Text style={styles.cardSubtitle}>{listing.broadLocation}</Text>
                  <Text style={styles.cardMeta}>{`$${listing.price}/mo · ${listing.status}`}</Text>
                </View>
                <View style={styles.cardActions}>
                  <AppButton
                    label="Edit"
                    onPress={() => router.push(`/rooms/${listing.id}/edit`)}
                    variant="secondary"
                  />
                  {listing.status === 'DRAFT' ? (
                    <AppButton
                      label="Publish"
                      onPress={() => publish.mutate(listing.id)}
                      loading={publish.isPending}
                      variant="primary"
                    />
                  ) : listing.status === 'ACTIVE' ? (
                    <AppButton
                      label="Pause"
                      onPress={() => pause.mutate(listing.id)}
                      loading={pause.isPending}
                      variant="secondary"
                    />
                  ) : listing.status === 'PAUSED' ? (
                    <AppButton
                      label="Publish"
                      onPress={() => publish.mutate(listing.id)}
                      loading={publish.isPending}
                      variant="primary"
                    />
                  ) : null}
                  <AppButton
                    label="Archive"
                    onPress={() => archive.mutate(listing.id)}
                    loading={archive.isPending}
                    variant="ghost"
                  />
                </View>
              </View>
            ))
          ) : (
            <EmptyState
              title="No listings yet"
              body="Create your first listing to start hosting."
              actionLabel="Create listing"
              onAction={() => router.push('/rooms/create-listing')}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RoomCard({ room, onUnsave }: { room: RoomListing; onUnsave?: () => void }) {
  const router = useRouter();
  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{room.title}</Text>
        <Text style={styles.cardSubtitle}>{room.broadLocation}</Text>
        <Text style={styles.cardMeta}>{`$${room.price}/mo · ${room.roomType}`}</Text>
      </View>
      <View style={styles.cardActions}>
        <AppButton
          label="View"
          onPress={() => router.push(`/rooms/${room.id}`)}
          variant="secondary"
        />
        {onUnsave ? <AppButton label="Unsave" onPress={onUnsave} variant="ghost" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { gap: space.x4, maxWidth: 720, width: '100%', alignSelf: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.x3,
    padding: space.x4,
  },
  cardBody: { gap: space.x1 },
  cardTitle: { ...typography.h4, color: colors.ink },
  cardSubtitle: { ...typography.body, color: colors.muted },
  cardMeta: { ...typography.caption, color: colors.primary },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
});
