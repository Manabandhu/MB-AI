import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { addComment, getPost, reactPost } from '../api';

const C = {
  primary: '#E05638', // Warm Saffron
  secondary: '#0D5C75', // Deep Gulf Teal
  bg: '#FFFDF9', // Soft warm ivory
  cardBg: '#FFFFFF',
  border: '#E8DEC8',
  ink: '#151D21',
  inkMuted: '#6B7280',
  tealBg: '#E0F2FE',
  saffronBg: '#FEE2E2',
  goldBg: '#FEF3C7',
  goldText: '#B45309',
  emerald: '#16A34A',
};

export function PostDetailsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { postId } = useLocalSearchParams<{ postId: string }>();

  const [commentText, setCommentText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [reactionCounts, setReactionCounts] = useState({
    helpful: 84,
    like: 129,
    heart: 42,
  });
  const [userReactions, setUserReactions] = useState<{ [key: string]: boolean }>({});

  const {
    data: postData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['community', 'post', postId],
    queryFn: () => getPost(postId!),
    enabled: !!postId,
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => addComment(postId!, text),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['community', 'post', postId] });
      Alert.alert('Comment Posted', 'Your reply has been shared with the community.');
    },
    onError: () => {
      Alert.alert('Unable to post comment', 'Please check your connection and try again.');
    },
  });

  const toggleReaction = (type: 'helpful' | 'like' | 'heart') => {
    const isAlready = !!userReactions[type];
    setUserReactions((prev) => ({ ...prev, [type]: !isAlready }));
    setReactionCounts((prev) => ({
      ...prev,
      [type]: isAlready ? prev[type] - 1 : prev[type] + 1,
    }));
    if (postId) {
      reactPost(postId, type.toUpperCase()).catch(() => {});
    }
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  };

  if (isLoading) {
    return (
      <View style={s.centerRoot}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={s.loadingText}>Loading discussion thread...</Text>
      </View>
    );
  }

  if (error || !postData) {
    return (
      <View style={s.centerRoot}>
        <AppIcon name="warning" size={44} color={C.primary} />
        <Text style={s.errorTitle}>Discussion Not Found</Text>
        <Text style={s.errorSub}>This post may have been removed or moved to another circle.</Text>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Back to Community Hub</Text>
        </Pressable>
      </View>
    );
  }

  const comments = postData.comments ?? [];

  return (
    <View style={s.root}>
      {/* Top App Bar */}
      <View style={s.navBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={s.navIconBtn}
          onPress={() => router.back()}
        >
          <AppIcon name="chevron-left" size={20} color={C.ink} />
        </Pressable>

        <View style={s.commBadgePill}>
          <AppIcon name="community" size={14} color={C.secondary} />
          <Text style={s.commBadgeText}>Community Hub</Text>
        </View>

        <View style={s.navRight}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share discussion"
            style={s.navIconBtn}
            onPress={() => Alert.alert('Share', 'Link copied to clipboard!')}
          >
            <AppIcon name="community" size={18} color={C.ink} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save post"
            style={s.navIconBtn}
            onPress={() => setIsSaved(!isSaved)}
          >
            <Text style={[s.heartIcon, isSaved && s.heartIconSaved]}>{isSaved ? '♥' : '♡'}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.scrollContent, isDesktop && s.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        {/* Author Header */}
        <View style={s.authorCard}>
          <View style={s.authorAvatarRing}>
            <Text style={s.authorInitial}>{(postData.authorName || 'C')[0].toUpperCase()}</Text>
          </View>
          <View style={s.authorMeta}>
            <View style={s.nameRow}>
              <Text style={s.authorName}>{postData.authorName || 'Community Member'}</Text>
              <AppIcon name="verified-user" size={15} color={C.secondary} />
            </View>
            <Text style={s.authorSub}>
              Posted {new Date(postData.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Post Title & Body */}
        <View style={s.contentCard}>
          <Text style={s.postTitle}>{postData.title}</Text>
          <Text style={s.postBody}>{postData.body}</Text>

          {/* Pinned Moderation Note */}
          <View style={s.pinnedNote}>
            <View style={s.pinnedHeader}>
              <AppIcon name="shield" size={18} color={C.secondary} />
              <Text style={s.pinnedTitle}>Community Guidelines & Moderation</Text>
            </View>
            <Text style={s.pinnedBody}>
              ManaBandhu discussions are moderated for trust, mutual respect, and community safety.
              Direct helpful advice and local insights are encouraged.
            </Text>
          </View>

          {/* Interactive Reactions Bar */}
          <View style={s.reactionBar}>
            <Pressable
              style={[s.reactionBtn, userReactions.helpful && s.reactionBtnActive]}
              onPress={() => toggleReaction('helpful')}
            >
              <Text style={s.reactionEmoji}>💡</Text>
              <Text style={[s.reactionText, userReactions.helpful && s.reactionTextActive]}>
                Helpful ({reactionCounts.helpful})
              </Text>
            </Pressable>

            <Pressable
              style={[s.reactionBtn, userReactions.like && s.reactionBtnActive]}
              onPress={() => toggleReaction('like')}
            >
              <Text style={s.reactionEmoji}>👍</Text>
              <Text style={[s.reactionText, userReactions.like && s.reactionTextActive]}>
                Like ({reactionCounts.like})
              </Text>
            </Pressable>

            <Pressable
              style={[s.reactionBtn, userReactions.heart && s.reactionBtnActive]}
              onPress={() => toggleReaction('heart')}
            >
              <Text style={s.reactionEmoji}>❤️</Text>
              <Text style={[s.reactionText, userReactions.heart && s.reactionTextActive]}>
                Heart ({reactionCounts.heart})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Comments Section */}
        <View style={s.commentsSection}>
          <View style={s.commentsHeaderRow}>
            <Text style={s.commentsHeaderTitle}>
              Discussion & Parent Insights ({comments.length})
            </Text>
            <Text style={s.topAnswersText}>Top Answers</Text>
          </View>

          {comments.map((comm) => (
            <View key={comm.id} style={s.commentCard}>
              <View style={s.commentAuthorRow}>
                <View style={s.commentAvatar}>
                  <Text style={s.commentAvatarText}>{(comm.authorName ?? 'B')[0]}</Text>
                </View>
                <View style={s.commentAuthorMeta}>
                  <Text style={s.commentAuthorName}>{comm.authorName ?? 'Community Member'}</Text>
                  <Text style={s.commentTime}>{new Date(comm.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={s.upvotePill}>
                  <Text style={s.upvoteIcon}>💬</Text>
                  <Text style={s.upvoteCount}>Reply</Text>
                </View>
              </View>
              <Text style={s.commentBody}>{comm.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Reply Bar */}
      <View style={[s.replyBar, isDesktop && s.replyBarDesktop]}>
        <TextInput
          style={s.replyInput}
          placeholder="Join the conversation in Telugu or English..."
          placeholderTextColor={C.inkMuted}
          value={commentText}
          onChangeText={setCommentText}
          onSubmitEditing={handleSendComment}
          returnKeyType="send"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Submit reply"
          style={[s.sendBtn, !commentText.trim() && s.sendBtnDisabled]}
          onPress={handleSendComment}
          disabled={!commentText.trim() || commentMutation.isPending}
        >
          {commentMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <AppIcon name="check" size={18} color="#FFF" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centerRoot: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: C.inkMuted,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.ink,
  },
  errorSub: {
    fontSize: 13,
    color: C.inkMuted,
    textAlign: 'center',
  },
  backBtn: {
    backgroundColor: C.secondary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.tealBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  commBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.secondary,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heartIcon: {
    fontSize: 18,
    color: C.ink,
  },
  heartIconSaved: {
    color: '#EF4444',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
  },
  scrollContentDesktop: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  authorAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.goldBg,
    borderWidth: 2,
    borderColor: '#D99B26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: C.goldText,
  },
  authorMeta: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
  },
  modTag: {
    backgroundColor: C.saffronBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.primary,
  },
  authorSub: {
    fontSize: 12,
    color: C.inkMuted,
  },
  contentCard: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    gap: 14,
    marginBottom: 20,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.ink,
    lineHeight: 26,
  },
  postBody: {
    fontSize: 14,
    color: C.ink,
    lineHeight: 23,
  },
  pinnedNote: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  pinnedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinnedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.secondary,
  },
  pinnedBody: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 18,
  },
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F9FAFB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reactionBtnActive: {
    backgroundColor: C.tealBg,
    borderColor: C.secondary,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.inkMuted,
  },
  reactionTextActive: {
    color: C.secondary,
  },
  commentsSection: {
    gap: 12,
  },
  commentsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentsHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
  },
  topAnswersText: {
    fontSize: 12,
    color: C.secondary,
    fontWeight: '600',
  },
  commentCard: {
    backgroundColor: C.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 8,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.secondary,
  },
  commentAuthorMeta: {
    flex: 1,
  },
  commentAuthorName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
  },
  commentTime: {
    fontSize: 11,
    color: C.inkMuted,
  },
  upvotePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upvoteIcon: {
    fontSize: 10,
    color: C.secondary,
  },
  upvoteCount: {
    fontSize: 11,
    fontWeight: '700',
    color: C.secondary,
  },
  commentBody: {
    fontSize: 13,
    color: C.ink,
    lineHeight: 20,
  },
  replyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.cardBg,
    borderTopWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 8,
  },
  replyBarDesktop: {
    maxWidth: 900,
    alignSelf: 'center',
    borderRadius: 16,
    bottom: 16,
    borderWidth: 1,
  },
  replyInput: {
    flex: 1,
    height: 44,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: C.ink,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
});
