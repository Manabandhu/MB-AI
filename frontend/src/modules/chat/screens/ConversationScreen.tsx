import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import {
  getConversation,
  getParticipants,
  listMessages,
  type Message,
  sendMessage,
} from '@/modules/chat/api';
import {
  conversationTitle,
  isHttpUrl,
  participantLabel,
  withoutDeliveredPending,
} from '@/modules/chat/chatFormat';
import { ChatBubble } from '@/modules/chat/components/ChatBubble';
import { ChatFrame, scrollToNewest } from '@/modules/chat/components/ChatFrame';
import { Composer } from '@/modules/chat/components/Composer';
import { latestServerMessageId } from '@/modules/chat/readState';
import { useMarkConversationRead } from '@/modules/chat/useMarkConversationRead';
import { useRealtimeChat } from '@/modules/chat/useRealtimeChat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { Screen } from '@/modules/shared/ui/Screen';

/** A message the server has not stored yet: in flight, or failed and waiting for Retry/Discard. */
type PendingMessage = { tempId: string; body: string; createdAt: string; failed: boolean };

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const byCreatedAt = (a: Message, b: Message) => Date.parse(a.createdAt) - Date.parse(b.createdAt);

/**
 * One conversation. Stored and live messages are merged by id; your own unsent messages stay in a separate pending
 * list until the server returns them, so a failed send is shown as "Not sent" with Retry, never as delivered.
 * Picture sending is not offered: there is no chat storage bucket, and a device file path is unreadable to others.
 * Ride chats (type RIDE_TEMP) say that they are purged 2 hours after the ride is completed, which the backend does.
 */
export default function ConversationScreen() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const conversation = useQuery({
    queryKey: ['chat', 'conversation', conversationId],
    queryFn: () => getConversation(conversationId),
    enabled: !!conversationId,
  });
  const participants = useQuery({
    queryKey: ['chat', 'participants', conversationId],
    queryFn: () => getParticipants(conversationId),
    enabled: !!conversationId,
  });
  const serverMessages = useQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => listMessages(conversationId),
    enabled: !!conversationId,
  });

  const mergeMessages = useCallback((incoming: Message[]) => {
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) map.set(m.id, m);
      return [...map.values()].sort(byCreatedAt);
    });
  }, []);

  useEffect(() => {
    if (serverMessages.data) mergeMessages(serverMessages.data);
  }, [serverMessages.data, mergeMessages]);

  const handleIncoming = useCallback(
    (incoming: Message) => {
      mergeMessages([incoming]);
      setPending((prev) => withoutDeliveredPending(prev, incoming, currentUserId));
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
    [mergeMessages, queryClient, currentUserId],
  );
  const { typingNames, sendTypingEvent } = useRealtimeChat(conversationId, handleIncoming);

  // Read receipt for the newest stored message, on open and whenever new messages arrive while focused.
  const latestMessageId = useMemo(() => latestServerMessageId(messages), [messages]);
  useMarkConversationRead(conversationId, latestMessageId);

  const deliver = useCallback(
    async (item: PendingMessage) => {
      setPending((prev) =>
        prev.map((p) => (p.tempId === item.tempId ? { ...p, failed: false } : p)),
      );
      try {
        const saved = await sendMessage(conversationId, item.body, 'TEXT');
        mergeMessages([saved]);
        setPending((prev) => prev.filter((p) => p.tempId !== item.tempId));
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      } catch {
        setPending((prev) =>
          prev.map((p) => (p.tempId === item.tempId ? { ...p, failed: true } : p)),
        );
      }
    },
    [conversationId, mergeMessages, queryClient],
  );

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    const item: PendingMessage = {
      tempId: `temp-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
      failed: false,
    };
    setPending((prev) => [...prev, item]);
    setDraft('');
    scrollToNewest(scrollRef);
    void deliver(item);
  };

  const nameOf = useMemo(() => {
    const map = new Map((participants.data ?? []).map((p) => [p.userId, p]));
    return (userId: string) => participantLabel(map.get(userId) ?? { userId }, currentUserId);
  }, [participants.data, currentUserId]);

  if (!conversationId) {
    return (
      <Screen>
        <BackButton fallback="/chat" />
        <ErrorState
          title="Conversation not found"
          body="No conversation was specified."
          retryLabel="Back to chats"
          onRetry={() => router.replace('/chat' as Href)}
        />
      </Screen>
    );
  }

  if (conversation.isError || serverMessages.isError) {
    return (
      <Screen>
        <BackButton fallback="/chat" />
        <ErrorState
          title="Unable to load conversation"
          body="It may have been removed, or you are no longer a member. Check your connection and try again."
          retryLabel="Retry"
          onRetry={() => {
            conversation.refetch();
            serverMessages.refetch();
          }}
        />
      </Screen>
    );
  }

  const title = conversationTitle(conversation.data);
  const memberCount = participants.data?.length;
  const isGroup = (memberCount ?? 0) > 2;
  const loading = conversation.isLoading || serverMessages.isLoading;

  const header = (
    <XStack alignItems="center" gap="$x2">
      <BackButton fallback="/chat" />
      <YStack flex={1} minWidth={0}>
        <AppText numberOfLines={1} role="heading" variant="h4">
          {title}
        </AppText>
        <AppText numberOfLines={1} tone="muted" variant="caption">
          {memberCount ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}` : ' '}
        </AppText>
      </YStack>
      <IconButton
        icon="more"
        label="Conversation details"
        onPress={() => router.push(`/chat/${conversationId}/info` as Href)}
        variant="plain"
      />
    </XStack>
  );

  return (
    <ChatFrame
      composer={
        <Composer
          label="Message"
          onChangeText={(text) => {
            setDraft(text);
            sendTypingEvent();
          }}
          onSend={handleSend}
          value={draft}
        />
      }
      header={header}
      notices={
        // Real: RideChatPurgeScheduler deletes RIDE_TEMP chats 2 hours after the driver completes the ride.
        String(conversation.data?.type ?? '').toUpperCase() === 'RIDE_TEMP' ? (
          <Card padding="$x3" variant="filled">
            <AppText variant="caption">
              Ride chat: this conversation is deleted 2 hours after the driver marks the ride
              completed.
            </AppText>
          </Card>
        ) : null
      }
      scrollRef={scrollRef}
    >
      {loading ? (
        <LoadingState label="Loading messages…" />
      ) : messages.length === 0 && pending.length === 0 ? (
        <EmptyState
          body="Say hello to start the conversation."
          iconName="message"
          title="No messages yet"
        />
      ) : (
        <>
          {messages.map((m) => {
            const mine = Boolean(currentUserId) && m.senderId === currentUserId;
            const system = String(m.messageType).toUpperCase() === 'SYSTEM';
            if (system) {
              return (
                <AppText center key={m.id} tone="muted" variant="caption">
                  {m.body}
                </AppText>
              );
            }
            const image = String(m.messageType).toUpperCase() === 'IMAGE' && isHttpUrl(m.body);
            return (
              <ChatBubble
                body={image || String(m.messageType).toUpperCase() !== 'IMAGE' ? m.body : 'Photo'}
                image={image}
                key={m.id}
                mine={mine}
                sender={isGroup ? nameOf(m.senderId) : undefined}
                time={timeOf(m.createdAt)}
              />
            );
          })}
          {pending.map((p) => (
            <ChatBubble
              body={p.body}
              key={p.tempId}
              mine
              onDiscard={() => setPending((prev) => prev.filter((x) => x.tempId !== p.tempId))}
              onRetry={() => void deliver(p)}
              status={p.failed ? 'failed' : 'sending'}
              time={timeOf(p.createdAt)}
            />
          ))}
        </>
      )}
      {typingNames.length > 0 ? (
        <AppText aria-live="polite" tone="muted" variant="caption">
          {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
        </AppText>
      ) : null}
    </ChatFrame>
  );
}
