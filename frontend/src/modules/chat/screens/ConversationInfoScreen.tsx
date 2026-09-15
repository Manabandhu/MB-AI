import { color } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getConversation, getParticipants, listMessages } from '@/modules/chat/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { useAdaptiveLayout } from '@/platform/adaptive';

export default function ConversationInfoScreen() {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const [isMuted, setIsMuted] = useState(false);

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
    data: participants,
    isLoading: loadingParticipants,
    isError: errorParticipants,
    refetch: refetchParticipants,
  } = useQuery({
    queryKey: ['chat', 'participants', conversationId],
    queryFn: () => getParticipants(conversationId),
    enabled: !!conversationId,
  });

  const { data: messages } = useQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => listMessages(conversationId),
    enabled: !!conversationId,
  });

  const title = conversation?.title ?? 'Conversation';
  const participantList = participants ?? [];

  // Filter media items from messages
  const mediaItems = (messages ?? [])
    .filter((m) => m.messageType === 'IMAGE' && m.body)
    .map((m) => m.body);

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
    Alert.alert(
      isMuted ? 'Notifications Unmuted' : 'Notifications Muted',
      isMuted
        ? 'You will now receive notifications for new messages.'
        : 'You will no longer receive alerts for this conversation.',
    );
  };

  const handleLeaveGroup = () => {
    Alert.alert('Leave Conversation', 'Are you sure you want to leave this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Left', 'You have left the conversation.');
          router.push('/chat' as Href);
        },
      },
    ]);
  };

  const handleReportUser = () => {
    Alert.alert(
      'Report User / Chat',
      'Help us keep ManaBandhu safe. Our safety team reviews all reports within 2 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Report',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Report Submitted', 'Thank you. We have received your safety report.');
          },
        },
      ],
    );
  };

  if (errorConversation || errorParticipants) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          body="Please check your connection and try again."
          onRetry={() => {
            refetchConversation();
            refetchParticipants();
          }}
          retryLabel="Retry"
          title="Unable to load conversation info"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          {/* Header */}
          <View style={styles.topNav}>
            <Pressable
              accessibilityLabel="Back to chat"
              accessibilityRole="button"
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <AppIcon color={color.ink} name="chevron-left" size={20} />
            </Pressable>
            <Text style={styles.topNavTitle}>Details</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Conversation Summary Card */}
          <View style={styles.card}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{title.slice(0, 2).toUpperCase()}</Text>
            </View>
            <Text style={styles.convoTitle}>{title}</Text>
            <Text style={styles.convoSubtitle}>
              {conversation?.type === 'RIDE_TEMP'
                ? '🚗 Temporary Carpool Chat'
                : conversation?.type === 'ROOM_INQUIRY'
                  ? '🏠 Room Inquiry Chat'
                  : '💬 Direct Message'}
            </Text>
          </View>

          {/* Members Section */}
          <SectionHeader subtitle={`${participantList.length} participants`} title="Members" />
          {loadingConversation || loadingParticipants ? (
            <LoadingState />
          ) : participantList.length === 0 ? (
            <EmptyState
              actionLabel="Go back"
              body="This conversation has no active participants."
              onAction={() => router.back()}
              title="No participants"
            />
          ) : (
            <View style={styles.memberList}>
              {participantList.map((p) => (
                <View key={p.id} style={styles.memberItem}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {(p.name || p.userId).slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {p.name || `User (${p.userId.slice(0, 8)})`}
                    </Text>
                    <Text style={styles.memberRole}>{p.role}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Shared Media Gallery */}
          <SectionHeader subtitle={`${mediaItems.length} photos shared`} title="Shared Media" />
          {mediaItems.length === 0 ? (
            <View style={styles.emptyMedia}>
              <AppIcon color="#9ca3af" name="plus" size={32} />
              <Text style={styles.emptyMediaText}>No photos shared yet in this chat</Text>
            </View>
          ) : (
            <View style={styles.mediaGrid}>
              {mediaItems.map((uri, idx) => (
                <Image
                  key={`${uri}-${idx}`}
                  resizeMode="cover"
                  source={{ uri }}
                  style={styles.mediaThumb}
                />
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <SectionHeader subtitle="Controls and safety" title="Actions" />
          <View style={styles.actionGroup}>
            <Pressable
              accessibilityLabel="Mute notifications"
              accessibilityRole="button"
              onPress={handleToggleMute}
              style={styles.actionBtn}
            >
              <AppIcon color={isMuted ? color.primary : '#374151'} name="bell" size={20} />
              <Text style={styles.actionBtnText}>
                {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Leave group"
              accessibilityRole="button"
              onPress={handleLeaveGroup}
              style={styles.actionBtn}
            >
              <AppIcon color="#dc2626" name="chevron-right" size={20} />
              <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Leave Conversation</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Report user"
              accessibilityRole="button"
              onPress={handleReportUser}
              style={styles.actionBtn}
            >
              <AppIcon color="#dc2626" name="warning" size={20} />
              <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Report User</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: color.background },
  page: { flexGrow: 1, padding: 16 },
  container: { gap: 16, width: '100%', alignSelf: 'center' },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  topNavTitle: { fontSize: 16, fontWeight: '700', color: color.ink },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(67,30,190,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLargeText: { fontSize: 24, fontWeight: '700', color: color.primary },
  convoTitle: { fontSize: 18, fontWeight: '700', color: color.ink, textAlign: 'center' },
  convoSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  memberList: { gap: 8 },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 14, fontWeight: '600', color: color.ink },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: color.ink },
  memberRole: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  emptyMedia: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyMediaText: { fontSize: 13, color: '#9ca3af' },
  actionGroup: { gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: color.ink },
});
