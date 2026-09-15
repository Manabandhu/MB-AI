import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { supabase } from '@/lib/supabase';
import type { Message } from './api';

export type TypingPayload = {
  userId: string;
  userName: string;
  conversationId: string;
};

export function useRealtimeChat(
  conversationId: string | undefined,
  onIncomingMessage?: (message: Message) => void,
) {
  const currentUser = useAuthStore((state) => state.user);
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});
  const typingTimeoutRef = useRef<{ [userId: string]: ReturnType<typeof setTimeout> }>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const channelName = `conversation:${conversationId}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    // 1. Listen for real-time messages via Postgres Changes (<50ms delivery)
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as unknown as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content?: string;
            message_type?: Message['messageType'];
            created_at?: string;
          };
          if (row && onIncomingMessage) {
            const msg: Message = {
              id: row.id,
              conversationId: row.conversation_id,
              senderId: row.sender_id,
              body: row.content || '',
              messageType: row.message_type || 'TEXT',
              createdAt: row.created_at || new Date().toISOString(),
              sent: true,
            };
            onIncomingMessage(msg);
          }
        },
      )
      // 2. Listen for typing indicator broadcasts
      .on('broadcast', { event: 'typing' }, ({ payload }: { payload: TypingPayload }) => {
        if (!payload || payload.userId === currentUser?.id) return;
        const uid = payload.userId;
        const name = payload.userName || 'Someone';

        setTypingUsers((prev) => ({ ...prev, [uid]: name }));

        if (typingTimeoutRef.current[uid]) {
          clearTimeout(typingTimeoutRef.current[uid]);
        }
        typingTimeoutRef.current[uid] = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[uid];
            return next;
          });
        }, 2500);
      })
      .subscribe();

    return () => {
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      typingTimeoutRef.current = {};
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, currentUser?.id, onIncomingMessage]);

  const sendTypingEvent = () => {
    if (!channelRef.current || !currentUser || !conversationId) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: currentUser.id,
        userName:
          currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
        conversationId,
      },
    });
  };

  const typingNames = Object.values(typingUsers);

  return {
    typingNames,
    sendTypingEvent,
  };
}
