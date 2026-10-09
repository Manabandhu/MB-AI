import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { Link, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import type { HomeShellData } from '@/modules/foundation/homeApi';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { colors, s } from './theme';

export function ChatShell({ isDesktop: _isDesktop }: { data: HomeShellData; isDesktop: boolean }) {
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: async () => {
      const { listConversations } = await import('@/modules/chat/api');
      return listConversations();
    },
  });

  return (
    <>
      <View style={s.chatHeader}>
        <Text style={s.chatTitle}>Messages</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New conversation"
          onPress={() => router.push('/chat/new')}
          style={s.composeBtn}
        >
          <AppIcon color="#fff" name="plus" size={16} />
        </Pressable>
      </View>

      <Pressable onPress={() => router.push('/chat')} style={s.searchBar}>
        <AppIcon color={colors.muted} name="search" size={18} />
        <Text style={s.searchPlaceholder}>Search conversations...</Text>
      </Pressable>

      <View style={s.convList}>
        <Text style={s.convListHeader}>RECENT</Text>
        {isLoading ? (
          <Text style={s.convPreview}>Loading messages...</Text>
        ) : conversations.length === 0 ? (
          <Text style={s.convPreview}>No conversations yet. Start a new chat below.</Text>
        ) : (
          conversations.map((conv) => (
            <Link key={conv.id} href={`/chat/${conv.id}` as Href} asChild>
              <Pressable accessibilityRole="button" style={s.convRow}>
                <View style={s.convAvatarWrap}>
                  <View style={s.convAvatar}>
                    <Text style={s.convAvatarText}>
                      {conv.type === 'ROOM_INQUIRY' ||
                      (conv.title ?? '').toLowerCase().includes('room')
                        ? '🏠'
                        : conv.type === 'RIDE_TEMP' ||
                            (conv.title ?? '').toLowerCase().includes('ride')
                          ? '🚗'
                          : (conv.title ?? 'C')[0].toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={s.convBody}>
                  <View style={s.convTop}>
                    <Text style={s.convName} numberOfLines={1}>
                      {conv.title ?? 'Conversation'}
                    </Text>
                    {conv.lastMessageAt ? (
                      <Text style={s.convTime}>
                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={[s.convPreview, (conv.unreadCount ?? 0) > 0 && s.convPreviewUnread]}
                    numberOfLines={1}
                  >
                    {conv.lastMessage ?? 'No messages yet'}
                  </Text>
                </View>
                {(conv.unreadCount ?? 0) > 0 ? (
                  <View style={s.unreadBadge}>
                    <Text style={s.unreadText}>{conv.unreadCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            </Link>
          ))
        )}
      </View>

      <Pressable onPress={() => router.push('/chat/new')} style={s.newChatBtn}>
        <AppIcon color={colors.appPrimary} name="plus" size={16} />
        <Text style={s.newChatText}>Start a New Conversation</Text>
      </Pressable>
    </>
  );
}

// ─── COMMUNITY SHELL ──────────────────────────────────────────────────────────
