import { formatRelative } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { listConversations } from '@/modules/chat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Avatar } from '@/modules/shared/ui/Avatar';
import { Card } from '@/modules/shared/ui/Card';
import { FadeIn } from '@/modules/shared/ui/motion/FadeIn';
import { Screen } from '@/modules/shared/ui/Screen';
import { SkeletonCard } from '@/modules/shared/ui/Skeleton';
import { TabHeader } from '../TabHeader';

const typeLabel = {
  DIRECT: 'Direct',
  GROUP: 'Group',
  ROOM_INQUIRY: 'Room inquiry',
  RIDE_TEMP: 'Ride',
} as const;

/** Conversation list. Counts and previews come straight from the chat API. */
export function ChatTab() {
  const t = useT();
  const query = useQuery({ queryKey: ['chat', 'conversations'], queryFn: listConversations });
  const conversations = query.data ?? [];
  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <Head>
        <title>Chat · ManaBandhu</title>
      </Head>
      <TabHeader
        actions={
          <AppButton
            icon="plus"
            label="New chat"
            onPress={() => router.push('/chat/new')}
            size="sm"
          />
        }
        subtitle={t('tabSubtitles.chat')}
        title={t('tabs.chat')}
      />
      {query.isLoading ? (
        <YStack gap="$x2">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </YStack>
      ) : query.isError ? (
        <ErrorState
          body="Your conversations could not load."
          onRetry={() => query.refetch()}
          title="Couldn't load chats"
        />
      ) : conversations.length === 0 ? (
        <EmptyState
          actionLabel="Start a conversation"
          body="Message a host, driver, or anyone you meet in the community."
          iconName="message"
          onAction={() => router.push('/chat/new')}
          title="No conversations yet"
        />
      ) : (
        <YStack gap="$x2">
          {conversations.map((conversation, index) => {
            const unread = conversation.unreadCount ?? 0;
            const title = conversation.title ?? 'Conversation';
            return (
              <FadeIn index={index} key={conversation.id}>
                <Card
                  aria-label={`${title}${unread ? `, ${unread} unread` : ''}`}
                  href={`/chat/${conversation.id}`}
                  padding="$x3"
                >
                  <XStack alignItems="center" gap="$x3">
                    <Avatar name={title} size="md" />
                    <YStack flex={1} gap={2}>
                      <XStack alignItems="center" gap="$x2">
                        <AppText flex={1} numberOfLines={1} variant="bodyStrong">
                          {title}
                        </AppText>
                        {conversation.lastMessageAt ? (
                          <AppText tone="muted" variant="caption">
                            {formatRelative(conversation.lastMessageAt)}
                          </AppText>
                        ) : null}
                      </XStack>
                      <AppText
                        numberOfLines={1}
                        tone={unread ? 'default' : 'muted'}
                        variant="caption"
                      >
                        {typeLabel[conversation.type]} ·{' '}
                        {conversation.lastMessage ?? 'No messages yet'}
                      </AppText>
                    </YStack>
                    {unread > 0 ? (
                      <YStack
                        alignItems="center"
                        backgroundColor="$primary"
                        borderRadius="$pill"
                        justifyContent="center"
                        minWidth={22}
                        paddingHorizontal={6}
                      >
                        <AppText color="$onPrimary" fontSize={12} fontWeight="800">
                          {unread}
                        </AppText>
                      </YStack>
                    ) : null}
                  </XStack>
                </Card>
              </FadeIn>
            );
          })}
        </YStack>
      )}
    </Screen>
  );
}
