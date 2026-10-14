import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { getAssistantMessages, sendAssistantMessage } from '@/modules/ai-assistant/api';
import { isUserRole, oldestFirst } from '@/modules/ai-assistant/assistantFormat';
import { ChatBubble, ChatFrame, Composer, scrollToNewest } from '@/modules/chat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { IconButton } from '@/modules/shared/ui/IconButton';

const timeOf = (iso: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

/**
 * The assistant conversation, oldest message first. The backend stores each question and currently answers with a
 * fixed "not connected to an AI model yet" reply, and the subtitle says so. A failed send puts the question back in
 * the input instead of losing it.
 */
export function AssistantScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const messages = useQuery({ queryKey: ['assistant', 'messages'], queryFn: getAssistantMessages });
  // Home quick prompts open the assistant pre-filled; the member still reviews and sends it.
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();
  const [text, setText] = useState(typeof prompt === 'string' ? prompt : '');

  const send = useMutation({
    mutationFn: (content: string) => sendAssistantMessage({ content }),
    // Awaiting keeps the pending bubble until the stored question and reply are in the list (no flicker).
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assistant'] });
      scrollToNewest(scrollRef);
    },
    onError: (_error, content) => {
      // Keep the question: restore it unless the member already typed something new.
      setText((current) => (current.trim() ? current : content));
    },
  });

  const onSend = () => {
    const content = text.trim();
    if (!content || send.isPending) return;
    setText('');
    send.reset();
    send.mutate(content);
    scrollToNewest(scrollRef);
  };

  const ordered = useMemo(() => oldestFirst(messages.data ?? []), [messages.data]);

  const header = (
    <XStack alignItems="center" gap="$x2">
      <BackButton fallback="/" />
      <YStack flex={1} minWidth={0}>
        <AppText numberOfLines={1} role="heading" variant="h4">
          ManaBandhu assistant
        </AppText>
        <AppText numberOfLines={2} tone="muted" variant="caption">
          Preview: no AI model connected, so it can't answer yet.
        </AppText>
      </YStack>
      <IconButton
        icon="clock"
        label="Assistant history"
        onPress={() => router.push('/assistant/history' as Href)}
        variant="plain"
      />
      <IconButton
        icon="book"
        label="Citations"
        onPress={() => router.push('/assistant/citations' as Href)}
        variant="plain"
      />
    </XStack>
  );

  const pendingQuestion = send.isPending ? send.variables : null;

  return (
    <ChatFrame
      composer={
        <Composer
          busy={send.isPending}
          label="Ask the assistant"
          onChangeText={setText}
          onSend={onSend}
          placeholder="Ask about rooms, rides, or safety…"
          sendLabel="Send question"
          value={text}
        />
      }
      header={header}
      notices={
        send.isError ? (
          <AppText role="alert" tone="danger" variant="caption">
            Your question was not sent
            {send.error instanceof Error ? ` (${send.error.message})` : ''}. It is back in the
            message field so you can send it again.
          </AppText>
        ) : null
      }
      scrollRef={scrollRef}
    >
      {messages.isLoading ? (
        <LoadingState count={3} variant="skeleton" />
      ) : messages.isError ? (
        <ErrorState
          body="Please check your connection and try again."
          onRetry={() => messages.refetch()}
          retryLabel="Retry"
          title="Unable to load messages"
        />
      ) : ordered.length === 0 && !pendingQuestion ? (
        <EmptyState
          body="Type a question below. Your questions are saved to your history."
          iconName="sparks"
          title="No messages yet"
        />
      ) : (
        <>
          {ordered.map((item) => (
            <ChatBubble
              body={item.content ?? item.body ?? ''}
              key={item.id}
              mine={isUserRole(item.role)}
              time={timeOf(item.createdAt)}
            />
          ))}
          {pendingQuestion ? (
            <>
              <ChatBubble body={pendingQuestion} mine status="sending" time="" />
              <AppText aria-live="polite" tone="muted" variant="caption">
                Assistant is replying…
              </AppText>
            </>
          ) : null}
        </>
      )}
    </ChatFrame>
  );
}
