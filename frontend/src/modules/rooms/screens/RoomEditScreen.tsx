import { color as colors, radius, space } from '@manabandhu/design-system';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/modules/shared/ui/AppButton';

export function RoomEditScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>Rooms</Text>
          <Text style={styles.title}>Edit listing</Text>
          <Text style={styles.subtitle}>
            Updating listing {roomId}. Modify pricing, availability, amenities, and visibility while
            preserving moderation state.
          </Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Placeholder</Text>
            <Text style={styles.cardBody}>
              This screen will render the full edit form once the room edit API is available.
            </Text>
          </View>
          <View style={styles.actions}>
            <AppButton label="View details" route={`/rooms/${roomId}`} variant="secondary" />
            <AppButton label="My listings" route="/rooms/my-listings" variant="secondary" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x6, maxWidth: 640, width: '100%' },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', lineHeight: 34 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 25 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.x2,
    padding: space.x4,
  },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', lineHeight: 24 },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3 },
});
