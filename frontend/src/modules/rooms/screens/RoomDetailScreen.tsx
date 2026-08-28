import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/authStore';
import { getRoomDetail, saveRoom, unsaveRoom } from '@/modules/rooms/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';

export function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const queryClient = useQueryClient();
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = status === 'authenticated';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rooms', 'detail', roomId],
    queryFn: () => getRoomDetail(roomId),
    enabled: Boolean(roomId),
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (data?.savedByViewer) {
        await unsaveRoom(roomId);
      } else {
        await saveRoom(roomId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', 'detail', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', 'favorites'] });
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load room"
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
          <Text style={styles.eyebrow}>Room</Text>
          <Text style={styles.title}>{data.title}</Text>
          {data.broadLocation ? (
            <Text style={styles.location}>{data.broadLocation} · approximate location</Text>
          ) : null}
          <Text style={styles.price}>
            {`$${data.price}`}
            <Text style={styles.pricePeriod}>/mo</Text>
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.cardBody}>{data.description || 'No description provided.'}</Text>
          </View>

          {data.amenities.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Amenities</Text>
              <View style={styles.chipRow}>
                {data.amenities.map((amenity) => (
                  <View key={amenity} style={styles.chip}>
                    <Text style={styles.chipText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Listing details</Text>
            <DetailRow label="Room type" value={data.roomType} />
            <DetailRow label="Status" value={data.status} />
          </View>

          <View style={styles.actions}>
            <AppButton
              label={data.savedByViewer ? 'Saved' : 'Save room'}
              onPress={() => isAuthenticated && toggleSave.mutate()}
              variant={data.savedByViewer ? 'secondary' : 'primary'}
              loading={toggleSave.isPending}
              disabled={!isAuthenticated}
            />
            <AppButton
              label="Contact host"
              route={`/rooms/${roomId}/inquiry`}
              variant="secondary"
            />
            <AppButton label="Back to search" route="/rooms/search" variant="ghost" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x5, maxWidth: 640, width: '100%' },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', lineHeight: 34 },
  location: { color: colors.muted, fontSize: 14 },
  price: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  pricePeriod: { fontSize: 16, fontWeight: '600', color: colors.muted },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.x2,
    padding: space.x4,
  },
  cardTitle: { ...typography.h4, color: colors.ink },
  cardBody: { ...typography.body, color: colors.muted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
  chip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.x3,
    paddingVertical: space.x1,
  },
  chipText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.x1 },
  detailLabel: { ...typography.body, color: colors.muted },
  detailValue: { ...typography.bodyStrong, color: colors.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
});
