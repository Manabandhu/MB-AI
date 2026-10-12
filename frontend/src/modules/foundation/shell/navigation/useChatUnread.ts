import { useQuery } from '@tanstack/react-query';
import { useT } from '@/i18n';
import { useAuthStore } from '@/lib/authStore';
import { type Conversation, listConversations } from '@/modules/chat';
import type { PrimaryTabName } from './tabs';
import { badgeText, totalUnread } from './unreadBadge';

/**
 * Total unread messages across the member's conversations, from the same `['chat', 'conversations']` query the Chat
 * tab uses (so opening a conversation or a new message refreshes both). `undefined` while signed out, loading, or
 * after an error: the badge then shows nothing rather than a guess.
 */
export function useChatUnread(): number | undefined {
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const { data, isError } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: listConversations,
    enabled: signedIn,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    select: (conversations: Conversation[]) => totalUnread(conversations),
  });
  if (!signedIn || isError) return undefined;
  return data;
}

/**
 * Visible label, unread count, and screen-reader label for each primary tab ("Chat, 3 unread"). Shared by the bottom
 * bar, rail, and top bar so all three announce the same thing.
 */
export function useTabLabels() {
  const t = useT();
  const chatUnread = useChatUnread();
  return (name: PrimaryTabName) => {
    const label = t(`tabs.${name}`);
    const count = name === 'chat' ? chatUnread : undefined;
    const text = badgeText(count);
    return {
      label,
      count,
      a11yLabel: text ? t('shell.unreadTab', { label, unread: text }) : label,
    };
  };
}
