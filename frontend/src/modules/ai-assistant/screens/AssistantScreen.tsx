import { color as colors, radius, space } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAssistantMessages, sendAssistantMessage } from '@/modules/ai-assistant/api';
import { Banner } from '@/modules/shared/components/Banner';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { MessageBubble } from '@/modules/shared/components/MessageBubble';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function AssistantScreen() {
  const layout = useAdaptiveLayout();
  const queryClient = useQueryClient();
  const messages = useQuery({ queryKey: ['assistant', 'messages'], queryFn: getAssistantMessages });
  const data = messages.data ?? [];
  const [text, setText] = useState('');
  const [offline, setOffline] = useState(false);

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendAssistantMessage({ content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant', 'messages'] });
      setOffline(false);
    },
    onError: () => setOffline(true),
  });

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    sendMutation.mutate(trimmed);
  };

  const sorted = useMemo(() => [...data].reverse(), [data]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
        <SectionHeader
          eyebrow="Assistant"
          title="ManaBandhu assistant"
          subtitle="Ask about rooms, rides, community, or safety."
        />
        {offline ? (
          <Banner
            title="Offline"
            body="You can view cached messages, but new queries are disabled."
            variant="warning"
          />
        ) : null}
        <ScrollView style={styles.chatScroll} contentContainerStyle={styles.chat}>
          {messages.isLoading ? (
            <LoadingState variant="skeleton" count={3} />
          ) : messages.isError ? (
            <ErrorState
              title="Unable to load messages"
              body="Please check your connection and try again."
              retryLabel="Retry"
              onRetry={() => messages.refetch()}
            />
          ) : data.length === 0 ? (
            <EmptyState
              title="No messages yet"
              body="Ask a question below to start chatting with ManaBandhu assistant."
              actionLabel="Start chatting"
              onAction={() => {}}
            />
          ) : (
            sorted.map((item) => (
              <MessageBubble
                key={item.id}
                body={item.body ?? item.content ?? ''}
                sent={item.sent ?? item.role === 'USER'}
                time={
                  item.time ??
                  (item.createdAt
                    ? new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '')
                }
              />
            ))
          )}
        </ScrollView>
        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            accessibilityLabel="Message input"
            style={styles.input}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Send"
            onPress={send}
            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
            disabled={!text.trim()}
          >
            <AppIcon color={colors.surface} name="message" size={18} />
          </TouchableOpacity>
        </View>
        <View style={styles.actions}>
          <AppButton label="History" route="/assistant/history" variant="secondary" />
          <AppButton label="Citations" route="/assistant/citations" variant="secondary" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { alignSelf: 'center', flex: 1, gap: space.x6, padding: space.x4, width: '100%' },
  chat: { flexGrow: 1, gap: space.x3 },
  chatScroll: { flex: 1 },
  inputRow: { flexDirection: 'row', gap: space.x3 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.control,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.control,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: space.x4,
  },
  sendButtonDisabled: { opacity: 0.5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3 },
});
