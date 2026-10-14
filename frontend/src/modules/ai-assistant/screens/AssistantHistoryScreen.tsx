import { formatDate } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import {
  type AssistantConversation,
  getAssistantConversationMessages,
  getAssistantHistory,
} from '@/modules/ai-assistant/api';
import { isUserRole, oldestFirst } from '@/modules/ai-assistant/assistantFormat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';

/** Messages of one past conversation, loaded when its row is opened. */
function ConversationMessages({ conversationId }: { conversationId: string }) {
  const messages = useQuery({
    queryKey: ['assistant', 'conversation', conversationId, 'messages'],
    queryFn: () => getAssistantConversationMessages(conversationId),
  });
  if (messages.isLoading) return <LoadingState label="Loading messages…" />;
  if (messages.isError) {
    return (
      <ErrorState
        body="Check your connection and try again."
        compact
        onRetry={() => messages.refetch()}
        retryLabel="Retry"
        title="Unable to load this conversation"
      />
    );
  }
  const list = oldestFirst(messages.data ?? []);
  if (list.length === 0) {
    return (
      <AppText tone="muted" variant="caption">
        No messages in this conversation.
      </AppText>
    );
  }
  return (
    <YStack gap="$x2">
      {list.map((m) => (
        <YStack gap={2} key={m.id}>
          <AppText tone={isUserRole(m.role) ? 'primary' : 'muted'} variant="label">
            {isUserRole(m.role) ? 'You' : 'Assistant'}
          </AppText>
          <AppText selectable variant="body">
            {m.content ?? m.body ?? ''}
          </AppText>
        </YStack>
      ))}
    </YStack>
  );
}

/** Your assistant conversations, newest first; open one to read it. New questions go to the latest conversation. */
export function AssistantHistoryScreen() {
  const router = useRouter();
  const history = useQuery({ queryKey: ['assistant', 'history'], queryFn: getAssistantHistory });
  const [openId, setOpenId] = useState<string | null>(null);

  const body = () => {
    if (history.isLoading) return <LoadingState count={4} variant="skeleton" />;
    if (history.isError) {
      return (
        <ErrorState
          body="Check your connection and try again."
          onRetry={() => history.refetch()}
          retryLabel="Retry"
          title="Unable to load history"
        />
      );
    }
    const data = history.data ?? [];
    if (data.length === 0) {
      return (
        <EmptyState
          actionLabel="Open assistant"
          body="Your past conversations will appear here."
          iconName="clock"
          onAction={() => router.push('/assistant' as Href)}
          title="No history yet"
        />
      );
    }
    return (
      <YStack gap="$x3">
        {data.map((item: AssistantConversation) => {
          const open = openId === item.id;
          const when = item.updatedAt || item.createdAt;
          return (
            <Card
              aria-expanded={open}
              aria-label={`${item.title || 'Conversation'}, ${open ? 'collapse' : 'expand'}`}
              key={item.id}
              onPress={() => setOpenId(open ? null : item.id)}
            >
              <XStack alignItems="center" gap="$x2">
                <AppIcon name="message" size={20} />
                <YStack flex={1} minWidth={0}>
                  <AppText numberOfLines={2} variant="bodyStrong">
                    {item.title || 'Conversation'}
                  </AppText>
                  {when ? (
                    <AppText tone="muted" variant="caption">
                      {formatDate(when, 'short')}
                    </AppText>
                  ) : null}
                </YStack>
                <AppIcon name={open ? 'chevron-down' : 'chevron-right'} size={18} />
              </XStack>
              {open ? <ConversationMessages conversationId={item.id} /> : null}
            </Card>
          );
        })}
      </YStack>
    );
  };

  return (
    <Screen onRefresh={() => history.refetch()} refreshing={history.isRefetching}>
      <ScreenHeader
        back={{ fallback: '/assistant' as Href }}
        subtitle="Open a conversation to read it again."
        title="History"
      />
      {body()}
    </Screen>
  );
}
