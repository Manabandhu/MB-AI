import { color } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/authStore';
import { getConversation, listMessages, type Message, sendMessage } from '@/modules/chat/api';
import { useRealtimeChat } from '@/modules/chat/useRealtimeChat';
import { Banner } from '@/modules/shared/components/Banner';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { MessageBubble } from '@/modules/shared/components/MessageBubble';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { useAdaptiveLayout } from '@/platform/adaptive';

export default function ConversationScreen() {
  const layout = useAdaptiveLayout();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const [message, setMessage] = useState('');
  const [offline, setOffline] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    data: conversation,
    isLoading: loadingConversation,
    isError: errorConversation,
    refetch: refetchConversation,
  } = useQuery({
    queryKey: ['chat', 'conversation', conversationId],
    queryFn: () => getConversation(conversationId),
    enabled: !!conversationId,
  });

  const {
    data: serverMessages,
    isLoading: loadingMessages,
    isError: errorMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => listMessages(conversationId),
    enabled: !!conversationId,
  });

  // Sync server messages into localMessages
  useEffect(() => {
    if (serverMessages) {
      setLocalMessages((prev) => {
        // Merge without losing optimistic or realtime messages
        const map = new Map<string, Message>();
        serverMessages.forEach((m) => {
          map.set(m.id, m);
        });
        prev.forEach((m) => {
          if (!map.has(m.id)) {
            map.set(m.id, m);
          }
        });
        return Array.from(map.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
    }
  }, [serverMessages]);

  const handleIncomingMessage = useCallback(
    (incoming: Message) => {
      setLocalMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    },
    [queryClient],
  );

  const { typingNames, sendTypingEvent } = useRealtimeChat(conversationId, handleIncomingMessage);

  const mutation = useMutation({
    mutationFn: (body: string) => sendMessage(conversationId, body, 'TEXT'),
    onSuccess: (sentMsg) => {
      setLocalMessages((prev) =>
        prev.map((m) => (m.id.startsWith('temp-') && m.body === sentMsg.body ? sentMsg : m)),
      );
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
    onError: () => setOffline(true),
  });

  const handleSend = () => {
    const text = message.trim();
    if (!text) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      conversationId,
      senderId: currentUser?.id ?? '',
      body: text,
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
      sent: true,
    };

    setLocalMessages((prev) => [...prev, optimisticMsg]);
    setMessage('');
    mutation.mutate(text);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handlePickImage = async () => {
    try {
      setIsPickingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const imageUri = result.assets[0].uri;
        const tempId = `temp-img-${Date.now()}`;
        const optimisticMsg: Message = {
          id: tempId,
          conversationId,
          senderId: currentUser?.id ?? '',
          body: imageUri,
          messageType: 'IMAGE',
          createdAt: new Date().toISOString(),
          sent: true,
        };
        setLocalMessages((prev) => [...prev, optimisticMsg]);
        await sendMessage(conversationId, imageUri, 'IMAGE');
        queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] });
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) {
      console.warn('Failed to pick image:', e);
    } finally {
      setIsPickingImage(false);
    }
  };

  const title = conversation?.title ?? 'Conversation';
  const participantNames = useMemo(() => {
    return conversation?.participants
      ? conversation.participants.map((p) => p.name || p.userId.slice(0, 8)).join(', ')
      : undefined;
  }, [conversation]);

  if (!conversationId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Conversation not found"
          body="No conversation identifier was specified."
          retryLabel="Back to chat"
          onRetry={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if (errorConversation || errorMessages) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load conversation"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={() => {
            refetchConversation();
            refetchMessages();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        style={{ flex: 1 }}
      >
        {/* Top Header */}
        <View style={[styles.headerBar, { maxWidth: layout.maxContentWidth }]}>
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <AppIcon color={color.ink} name="chevron-left" size={20} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {title}
            </Text>
            <Text numberOfLines={1} style={styles.headerSubtitle}>
              {participantNames ?? 'Active conversation'}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Conversation info"
            accessibilityRole="button"
            onPress={() => router.push(`/chat/${conversationId}/info` as Href)}
            style={styles.infoBtn}
          >
            <AppIcon color={color.primary} name="help" size={20} />
          </Pressable>
        </View>

        {/* Banners */}
        {conversation?.type === 'RIDE_TEMP' ||
        (conversation?.title ?? '').toLowerCase().includes('ride') ? (
          <View style={styles.bannerContainer}>
            <Banner
              body="This conversation will self-delete 2 hours after trip arrival."
              title="🔒 Temporary Chat"
              variant="info"
            />
          </View>
        ) : null}

        {offline ? (
          <View style={styles.bannerContainer}>
            <Banner
              body="You can view cached messages, but sending is currently disabled."
              title="Offline"
              variant="warning"
            />
          </View>
        ) : null}

        {/* Message Scroll View */}
        <ScrollView
          contentContainerStyle={styles.messageScroll}
          keyboardShouldPersistTaps="handled"
          ref={scrollViewRef}
        >
          {loadingConversation || loadingMessages ? (
            <LoadingState />
          ) : localMessages.length === 0 ? (
            <EmptyState
              actionLabel="Say Hello"
              body="Start the conversation by sending a greeting."
              onAction={() => {
                setMessage('Hello! 👋');
              }}
              title="No messages yet"
            />
          ) : (
            <View style={[styles.messageList, { maxWidth: layout.maxContentWidth }]}>
              {localMessages.map((m) => {
                const isMe = m.sent ?? (currentUser?.id ? m.senderId === currentUser.id : false);
                return (
                  <View
                    key={m.id}
                    style={[styles.bubbleWrapper, isMe ? styles.bubbleMe : styles.bubbleOther]}
                  >
                    {m.messageType === 'IMAGE' ? (
                      <View style={[styles.imageBubble, isMe ? styles.bgMe : styles.bgOther]}>
                        <Image
                          resizeMode="cover"
                          source={{ uri: m.body }}
                          style={styles.msgImage}
                        />
                        <Text style={[styles.bubbleTime, isMe ? styles.timeMe : styles.timeOther]}>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    ) : (
                      <MessageBubble
                        body={m.body}
                        key={m.id}
                        sent={isMe}
                        time={new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Typing Indicator */}
          {typingNames.length > 0 ? (
            <View style={styles.typingRow}>
              <View style={styles.typingDot} />
              <Text style={styles.typingText}>
                {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Sticky Bottom Input Bar */}
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              maxWidth: layout.maxContentWidth,
            },
          ]}
        >
          <Pressable
            accessibilityLabel="Attach image"
            accessibilityRole="button"
            disabled={isPickingImage}
            onPress={handlePickImage}
            style={styles.attachBtn}
          >
            {isPickingImage ? (
              <ActivityIndicator color={color.primary} size="small" />
            ) : (
              <AppIcon color={color.primary} name="plus" size={22} />
            )}
          </Pressable>

          <TextInput
            accessibilityLabel="Message input"
            multiline
            onChangeText={(text) => {
              setMessage(text);
              sendTypingEvent();
            }}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            style={styles.inputField}
            value={message}
          />

          <Pressable
            accessibilityLabel="Send message"
            accessibilityRole="button"
            disabled={!message.trim() || mutation.isPending}
            onPress={handleSend}
            style={[
              styles.sendBtn,
              { backgroundColor: message.trim() ? color.primary : '#d1d5db' },
            ]}
          >
            <AppIcon color="#fff" name="chevron-right" size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: color.background },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#fff',
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1, marginHorizontal: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: color.ink },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  infoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContainer: { paddingHorizontal: 16, paddingTop: 8 },
  messageScroll: { flexGrow: 1, padding: 16 },
  messageList: { gap: 12, width: '100%', alignSelf: 'center' },
  bubbleWrapper: { maxWidth: '82%' },
  bubbleMe: { alignSelf: 'flex-end' },
  bubbleOther: { alignSelf: 'flex-start' },
  imageBubble: { borderRadius: 16, padding: 6, overflow: 'hidden' },
  bgMe: { backgroundColor: '#431ebe' },
  bgOther: { backgroundColor: '#f3f4f6' },
  msgImage: { width: 220, height: 160, borderRadius: 12 },
  bubbleTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  timeMe: { color: 'rgba(255,255,255,0.7)' },
  timeOther: { color: '#6b7280' },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 8,
    gap: 6,
  },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.primary },
  typingText: { fontSize: 12, color: '#6b7280', fontStyle: 'italic' },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    width: '100%',
    alignSelf: 'center',
    gap: 8,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(67,30,190,0.06)',
  },
  inputField: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: color.ink,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
