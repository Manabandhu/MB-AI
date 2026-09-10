import { color } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getConversation, listMessages, sendMessage } from '@/modules/chat/api';
import { chatScreenFallbacks } from '@/modules/chat/chatFallbacks';
import { Banner } from '@/modules/shared/components/Banner';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { MessageBubble } from '@/modules/shared/components/MessageBubble';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { TextArea } from '@/modules/shared/components/TextArea';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { useAdaptiveLayout } from '@/platform/adaptive';

export default function ConversationScreen() {
  const _router = useRouter();
  const layout = useAdaptiveLayout();
  const queryClient = useQueryClient();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const [message, setMessage] = useState('');
  const [offline, setOffline] = useState(false);
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
    data: messages,
    isLoading: loadingMessages,
    isError: errorMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => listMessages(conversationId),
    enabled: !!conversationId,
  });

  const mutation = useMutation({
    mutationFn: (body: string) => sendMessage(conversationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] });
      setMessage('');
    },
    onError: () => setOffline(true),
  });

  const fallback = chatScreenFallbacks.conversation;
  const title = conversation?.title ?? fallback.title;
  const messageList = messages ?? fallback.messages ?? [];
  const participantNames = conversation?.participants
    ? conversation.participants.map((p) => p.userId).join(', ')
    : undefined;

  if (errorConversation || errorMessages) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load conversation"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={() => {
            refetchConversation();
            refetchMessages();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader title={title} subtitle={participantNames ?? fallback.subtitle} />
          {offline ? (
            <Banner
              title="Offline"
              body="You can view cached messages, but sending is disabled."
              variant="warning"
            />
          ) : null}
          {loadingConversation || loadingMessages ? (
            <LoadingState />
          ) : messageList.length === 0 ? (
            <EmptyState
              title="No messages"
              body="Start the conversation by sending a message."
              actionLabel="Compose"
              onAction={() => {}}
            />
          ) : (
            <View style={styles.messages}>
              {messageList.map((m) => (
                <MessageBubble
                  key={m.id}
                  body={m.body}
                  time={new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  sent={m.sent ?? false}
                />
              ))}
            </View>
          )}
          <View style={styles.composer}>
            <TextArea
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              accessibilityLabel="Message input"
            />
            <AppButton label="Send" onPress={() => message.trim() && mutation.mutate(message)} />
          </View>
          <View style={styles.actions}>
            <AppButton
              label="Conversation Info"
              route={`/chat/${conversationId}/info`}
              variant="secondary"
            />
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
  messages: { gap: 12 },
  composer: { gap: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
