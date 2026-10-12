import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { type Conversation, markConversationRead } from './api';
import { withUnreadCount } from './readState';

const DEBOUNCE_MS = 600;

/**
 * Marks the open conversation read up to `latestMessageId` while the screen is focused and the app is in the
 * foreground, debounced so a burst of incoming messages makes one call. The cached `['chat', 'conversations']` list
 * (tab badge and list pills) is updated only after the server accepts the call; a failure leaves the unread state as
 * it was and is retried on the next message or focus, so the badge never clears on a guess.
 */
export function useMarkConversationRead(
  conversationId: string | undefined,
  latestMessageId: string | undefined,
) {
  const queryClient = useQueryClient();
  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const markedRef = useRef<string | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setForeground(state === 'active'));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!conversationId || !latestMessageId || !focused || !foreground) return;
    const key = `${conversationId}:${latestMessageId}`;
    if (markedRef.current === key) return;
    const timer = setTimeout(() => {
      markConversationRead(conversationId, latestMessageId)
        .then((state) => {
          markedRef.current = key;
          queryClient.setQueryData<Conversation[]>(['chat', 'conversations'], (list) =>
            withUnreadCount(list, conversationId, state.unreadCount),
          );
          queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        })
        .catch(() => {
          // Background read receipt: keep the server's unread state; the next message or focus retries.
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [conversationId, latestMessageId, focused, foreground, queryClient]);
}
