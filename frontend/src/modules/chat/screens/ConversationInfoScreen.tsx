import { useQuery } from '@tanstack/react-query';
import { type Href, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { getConversation, getParticipants, listMessages } from '@/modules/chat/api';
import {
  conversationTitle,
  conversationTypeLabel,
  isHttpUrl,
  participantLabel,
  roleLabel,
} from '@/modules/chat/chatFormat';
import { ReportSheet } from '@/modules/safety';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Avatar } from '@/modules/shared/ui/Avatar';
import { Card } from '@/modules/shared/ui/Card';
import { PersonRow } from '@/modules/shared/ui/PersonRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { Section } from '@/modules/shared/ui/Section';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

type ReportTarget = { id: string; type: 'user' | 'conversation'; label: string };

/**
 * Conversation details: type, members, shared photos, and real safety reports (a member or the whole conversation).
 * Mute and leave are not offered: the backend has no endpoints for them yet.
 */
export default function ConversationInfoScreen() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

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
  const messages = useQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => listMessages(conversationId),
    enabled: !!conversationId,
  });

  const refresh = () => {
    conversation.refetch();
    participants.refetch();
    messages.refetch();
  };
  const header = (
    <ScreenHeader back={{ fallback: `/chat/${conversationId}` as Href }} title="Details" />
  );

  if (conversation.isLoading || participants.isLoading) {
    return (
      <Screen>
        {header}
        <LoadingState label="Loading details…" />
      </Screen>
    );
  }

  if (conversation.isError || participants.isError) {
    return (
      <Screen onRefresh={refresh}>
        {header}
        <ErrorState
          body="Check your connection and try again."
          onRetry={refresh}
          retryLabel="Retry"
          title="Unable to load conversation details"
        />
      </Screen>
    );
  }

  const title = conversationTitle(conversation.data);
  const members = participants.data ?? [];
  const photos = (messages.data ?? [])
    .filter((m) => String(m.messageType).toUpperCase() === 'IMAGE' && isHttpUrl(m.body))
    .map((m) => ({ id: m.id, uri: m.body }));

  return (
    <Screen onRefresh={refresh} refreshing={conversation.isRefetching}>
      {header}
      <Card alignItems="center" gap="$x2" padding="$x5">
        <Avatar name={title} size="lg" />
        <AppText center role="heading" variant="h3">
          {title}
        </AppText>
        <StatusBadge label={conversationTypeLabel(conversation.data?.type)} tone="primary" />
      </Card>

      <Section
        subtitle={`${members.length} ${members.length === 1 ? 'member' : 'members'}`}
        title="Members"
      >
        {members.length === 0 ? (
          <EmptyState
            body="Nobody else is in this conversation."
            compact
            iconName="community"
            title="No members"
          />
        ) : (
          <YStack gap="$x2">
            {members.map((p) => {
              const isMe = p.userId === currentUserId;
              const name = participantLabel(p, currentUserId);
              return (
                <PersonRow
                  actions={
                    isMe ? undefined : (
                      <AppButton
                        icon="warning"
                        label="Report"
                        onPress={() => setReportTarget({ id: p.userId, type: 'user', label: name })}
                        size="sm"
                        variant="ghost"
                      />
                    )
                  }
                  badge={
                    String(p.role).toUpperCase() === 'OWNER' ? (
                      <StatusBadge label={roleLabel(p.role)} tone="info" />
                    ) : undefined
                  }
                  key={p.id}
                  name={name}
                  subtitle={`${roleLabel(p.role)} · joined ${new Date(p.joinedAt).toLocaleDateString()}`}
                />
              );
            })}
          </YStack>
        )}
      </Section>

      <Section
        subtitle={
          messages.isError
            ? 'Photos could not be loaded'
            : `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`
        }
        title="Shared photos"
      >
        {photos.length === 0 ? (
          <AppText tone="muted" variant="caption">
            {messages.isError ? 'Pull to refresh to try again.' : 'No photos in this conversation.'}
          </AppText>
        ) : (
          <XStack flexWrap="wrap" gap="$x2">
            {photos.map((photo) => (
              <Image
                accessibilityLabel="Shared photo"
                key={photo.id}
                resizeMode="cover"
                source={{ uri: photo.uri }}
                style={{ width: 96, height: 96, borderRadius: 12 }}
              />
            ))}
          </XStack>
        )}
      </Section>

      <Section subtitle="Reports go to the ManaBandhu safety team." title="Safety">
        <AppButton
          icon="warning"
          label="Report this conversation"
          onPress={() =>
            setReportTarget({
              id: conversationId,
              type: 'conversation',
              label: 'this conversation',
            })
          }
          variant="secondary"
        />
        <AppButton icon="shield" label="Safety Center" route="/safety" variant="ghost" />
      </Section>

      <ReportSheet
        onClose={() => setReportTarget(null)}
        targetId={reportTarget?.id ?? null}
        targetLabel={reportTarget?.label ?? ''}
        targetType={reportTarget?.type ?? 'user'}
        visible={reportTarget !== null}
      />
    </Screen>
  );
}
