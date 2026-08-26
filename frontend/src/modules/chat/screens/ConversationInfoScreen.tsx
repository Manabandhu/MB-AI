import { color } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getConversation, getParticipants } from '@/modules/chat/api';
import { chatScreenFallbacks } from '@/modules/chat/chatFallbacks';
import { Banner } from '@/modules/shared/components/Banner';
import { DetailScreen } from '@/modules/shared/components/DetailScreen';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { useAdaptiveLayout } from '@/platform/adaptive';

export default function ConversationInfoScreen() {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const [offline, _setOffline] = useState(false);
  const {
    data: conversation,
    isLoading: loadingConversation,
    isError: errorConversation,
    refetch: refetchConversation,
  } = useQuery({
    queryKey: ['chat', 'conversation', conversationId],
    queryFn: () => getConversation(conversationId),
    enabled: !!conversationId,
  });
  const {
    data: participants,
    isLoading: loadingParticipants,
    isError: errorParticipants,
    refetch: refetchParticipants,
  } = useQuery({
    queryKey: ['chat', 'participants', conversationId],
    queryFn: () => getParticipants(conversationId),
    enabled: !!conversationId,
  });

  const fallback = chatScreenFallbacks.info;
  const title = conversation?.title ?? fallback.title;
  const participantList = participants ?? fallback.participants ?? [];

  if (errorConversation || errorParticipants) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load conversation info"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={() => {
            refetchConversation();
            refetchParticipants();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          {offline ? (
            <Banner title="Offline" body="Some details may be out of date." variant="warning" />
          ) : null}
          <DetailScreen
            eyebrow={fallback.eyebrow}
            title={title}
            subtitle={fallback.subtitle}
            sections={[]}
            actions={[
              { label: 'Back to Chat', onPress: () => router.back(), variant: 'secondary' },
            ]}
          />
          <SectionHeader title="Participants" subtitle={`${participantList.length} members`} />
          {loadingConversation || loadingParticipants ? (
            <LoadingState />
          ) : participantList.length === 0 ? (
            <EmptyState
              title="No participants"
              body="This conversation has no participants."
              actionLabel="Go back"
              onAction={() => router.back()}
            />
          ) : (
            <View style={styles.list}>
              {participantList.map((p) => (
                <View key={p.id} style={styles.item}>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>{p.name}</Text>
                    <Text style={styles.itemMeta}>{p.role}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={styles.actions}>
            <AppButton label="Back to Chat" route={`/chat/${conversationId}`} variant="secondary" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: color.background },
  page: { flexGrow: 1, padding: 16 },
  container: { gap: 16, width: '100%', alignSelf: 'center' },
  list: { gap: 12 },
  item: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  itemBody: { gap: 4 },
  itemTitle: { color: color.ink, fontSize: 17, fontWeight: '800', lineHeight: 22 },
  itemMeta: { color: color.muted, fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
