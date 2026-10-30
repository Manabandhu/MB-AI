import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { addParticipant, createConversation } from '@/modules/chat/api';
import { type ChatContact, useChatContacts } from '@/modules/chat/contacts';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ACTION_BAR_SPACE, ActionBar } from '@/modules/shared/ui/ActionBar';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { showError } from '@/modules/shared/ui/notify';
import { PersonRow } from '@/modules/shared/ui/PersonRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';

/**
 * Starts a direct or group chat with people you already share a conversation with (the app has no member search
 * yet, so those are the only people the app can name). One person reopens your existing direct chat when there is
 * one; otherwise the server creates the conversation and the members are added to it.
 */
export default function NewChatScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const contacts = useChatContacts(currentUserId);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupNameTouched, setGroupNameTouched] = useState(false);

  const list = contacts.data ?? [];
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (c) =>
        c.label.toLowerCase().includes(term) ||
        c.sharedIn.some((s) => s.title.toLowerCase().includes(term)),
    );
  }, [list, query]);

  const isGroup = selected.length > 1;
  const groupNameError =
    isGroup && groupNameTouched && !groupName.trim() ? 'Name the group chat.' : null;

  const start = useMutation({
    mutationFn: async (people: ChatContact[]) => {
      if (people.length === 1) {
        const existing = people[0].sharedIn.find((c) => c.type === 'DIRECT');
        if (existing) return { id: existing.id, failed: 0 };
      }
      const conversation = await createConversation(
        people.length === 1
          ? { type: 'DIRECT' }
          : { type: 'GROUP', title: groupName.trim().slice(0, 200) },
      );
      const results = await Promise.allSettled(
        people.map((p) => addParticipant(conversation.id, p.userId)),
      );
      const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failures.length === people.length) {
        // Nobody could be added: do not open an empty chat (there is no endpoint to delete it).
        throw failures[0].reason instanceof Error
          ? failures[0].reason
          : new Error('Nobody could be added to the chat.');
      }
      return { id: conversation.id, failed: failures.length };
    },
    onSuccess: ({ id, failed }) => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      if (failed > 0) {
        showError(
          'Some people were not added',
          `${failed} ${failed === 1 ? 'person' : 'people'} could not be added. The chat was created; try again from a new chat.`,
        );
      }
      router.replace(`/chat/${id}` as Href);
    },
    onError: (error) => showError('Could not start the chat', error),
  });

  const toggle = (userId: string) =>
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );

  const onStart = () => {
    setGroupNameTouched(true);
    if (selected.length === 0) return;
    if (isGroup && !groupName.trim()) return;
    start.mutate(list.filter((c) => selected.includes(c.userId)));
  };

  const body = () => {
    if (contacts.isLoading) return <LoadingState label="Loading people you chat with…" />;
    if (contacts.isError) {
      return (
        <ErrorState
          body="Check your connection and try again."
          onRetry={() => contacts.refetch()}
          retryLabel="Retry"
          title="Unable to load your contacts"
        />
      );
    }
    if (list.length === 0) {
      return (
        <EmptyState
          actionLabel="Browse rooms"
          body="Chats start from a room inquiry, a ride, or a listing. After that, you can start new chats with the same people here."
          iconName="message"
          onAction={() => router.push('/rooms' as Href)}
          secondaryActionLabel="Find a ride"
          onSecondaryAction={() => router.push('/rides' as Href)}
          title="No one to message yet"
        />
      );
    }
    return (
      <YStack gap="$x3">
        <TextField
          aria-label="Search people"
          leadingIcon="search"
          onChangeText={setQuery}
          placeholder="Search by name or chat"
          trailing={
            query ? (
              <IconButton
                icon="close"
                label="Clear search"
                onPress={() => setQuery('')}
                variant="plain"
              />
            ) : undefined
          }
          value={query}
        />
        {filtered.length === 0 ? (
          <EmptyState
            actionLabel="Clear search"
            body="No one you chat with matches that search."
            compact
            onAction={() => setQuery('')}
            title="No matches"
          />
        ) : (
          <YStack gap="$x2">
            {filtered.map((c) => {
              const isSelected = selected.includes(c.userId);
              return (
                <PersonRow
                  actions={
                    <AppButton
                      icon={isSelected ? 'check' : 'plus'}
                      label={isSelected ? 'Added' : 'Add'}
                      onPress={() => toggle(c.userId)}
                      size="sm"
                      variant={isSelected ? 'primary' : 'secondary'}
                    />
                  }
                  key={c.userId}
                  name={c.label}
                  subtitle={`In ${c.sharedIn.map((s) => s.title).join(', ')}`}
                />
              );
            })}
          </YStack>
        )}
        {isGroup ? (
          <TextField
            error={groupNameError}
            label="Group name"
            maxLength={200}
            onBlur={() => setGroupNameTouched(true)}
            onChangeText={setGroupName}
            placeholder="e.g. Arbor Oaks flatmates"
            value={groupName}
          />
        ) : null}
      </YStack>
    );
  };

  return (
    <YStack flex={1}>
      <Screen
        bottomInset={selected.length > 0 ? ACTION_BAR_SPACE : 0}
        keyboardAvoiding
        onRefresh={() => contacts.refetch()}
        refreshing={contacts.isRefetching}
      >
        <ScreenHeader
          back={{ fallback: '/chat' as Href }}
          subtitle="Message people you already chat with"
          title="New chat"
        />
        {body()}
      </Screen>
      {selected.length > 0 ? (
        <ActionBar
          label="Start chat"
          leading={
            <AppText variant="bodyStrong">
              {selected.length === 1 ? '1 person' : `${selected.length} people · group chat`}
            </AppText>
          }
        >
          <AppButton
            label={selected.length === 1 ? 'Open chat' : 'Start group chat'}
            loading={start.isPending}
            onPress={onStart}
          />
        </ActionBar>
      ) : null}
    </YStack>
  );
}
