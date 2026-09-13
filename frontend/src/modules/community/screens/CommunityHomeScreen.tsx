import { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { listCommunities } from '../api';
import { apiFetch } from '@/lib/apiClient';

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

type LivePost = {
  id: string;
  communityId: string;
  ownerId: string;
  title: string;
  body: string;
  createdAt: string;
};

export function CommunityHomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [joinedCommunities, setJoinedCommunities] = useState<Set<string>>(new Set());

  // Fetch communities
  const { data: communities = [], isLoading: loadingCommunities } = useQuery({
    queryKey: ['communities', 'all'],
    queryFn: listCommunities,
  });

  // Fetch all posts
  const { data: posts = [], isLoading: loadingPosts } = useQuery<LivePost[]>({
    queryKey: ['community', 'posts', 'all'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/posts');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const toggleJoin = (id: string) => {
    setJoinedCommunities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchBody = p.body.toLowerCase().includes(q);
        if (!matchTitle && !matchBody) return false;
      }
      if (selectedTopic !== 'all') {
        const matchingComm = communities.find(
          (c) => c.name.toLowerCase().includes(selectedTopic.toLowerCase()),
        );
        if (matchingComm && p.communityId !== matchingComm.id) return false;
      }
      return true;
    });
  }, [posts, searchQuery, selectedTopic, communities]);

  const getCommunityName = (commId: string) => {
    const comm = communities.find((c) => c.id === commId);
    return comm ? comm.name : 'Texas Desi Community';
  };

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.scrollContent, isDesktop && s.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Trust Banner */}
        <View style={s.hubBanner}>
          <View style={s.hubLeft}>
            <View style={s.hubIconBox}>
              <AppIcon name="community" size={22} color={C.secondary} />
            </View>
            <View style={s.hubTextGroup}>
              <Text style={s.hubTitle}>Telugu & Desi Community Hub</Text>
              <Text style={s.hubSubtitle}>
                Parent insights, career referrals, housing tips & regional recipes
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create Post"
            style={s.createPostBtn}
            onPress={() => router.push('/community/create-post')}
          >
            <AppIcon name="plus" size={16} color="#FFF" />
            <Text style={s.createPostBtnText}>New Post</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={s.searchWrap}>
          <AppIcon name="search" size={20} color={C.inkMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search posts, school advice, H-1B tips, recipes..."
            placeholderTextColor={C.inkMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text style={s.clearText}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Topic Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.topicScroll}
        >
          {[
            { id: 'all', label: 'All Discussions' },
            { id: 'Families', label: 'Schools & Families' },
            { id: 'Tech', label: 'Tech & Career' },
            { id: 'Housing', label: 'Housing & Flatmates' },
            { id: 'Food', label: 'Recipes & Foodies' },
          ].map((topic) => {
            const isActive = selectedTopic === topic.id;
            return (
              <Pressable
                key={topic.id}
                style={[s.topicChip, isActive && s.topicChipActive]}
                onPress={() => setSelectedTopic(topic.id)}
              >
                <Text style={[s.topicChipText, isActive && s.topicChipTextActive]}>
                  {topic.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Featured Community Circles Carousel */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeader}>Featured Community Circles</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.circlesRow}
          >
            {communities.map((c) => {
              const joined = joinedCommunities.has(c.id);
              return (
                <View key={c.id} style={s.circleCard}>
                  <View style={s.circleTop}>
                    <View style={s.circleAvatar}>
                      <Text style={s.circleInitial}>{c.name[0]}</Text>
                    </View>
                    <Pressable
                      style={[s.joinBtn, joined && s.joinBtnActive]}
                      onPress={() => toggleJoin(c.id)}
                    >
                      <Text style={[s.joinBtnText, joined && s.joinBtnTextActive]}>
                        {joined ? 'Joined' : '+ Join'}
                      </Text>
                    </Pressable>
                  </View>
                  <Text style={s.circleName} numberOfLines={2}>
                    {c.name}
                  </Text>
                  <Text style={s.circleDesc} numberOfLines={2}>
                    {c.description}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Community Feed */}
        <View style={s.sectionWrap}>
          <View style={s.feedHeaderRow}>
            <Text style={s.sectionHeader}>Recent Discussions</Text>
            <Text style={s.feedCountText}>{filteredPosts.length} posts</Text>
          </View>

          {loadingPosts && (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={s.loadingText}>Loading community feed...</Text>
            </View>
          )}

          {!loadingPosts && filteredPosts.length === 0 && (
            <View style={s.emptyFeedBox}>
              <AppIcon name="package" size={36} color={C.secondary} />
              <Text style={s.emptyFeedTitle}>No discussions found</Text>
              <Text style={s.emptyFeedSub}>Try clearing your search or topic filter.</Text>
            </View>
          )}

          <View style={s.feedList}>
            {filteredPosts.map((post) => {
              const commName = getCommunityName(post.communityId);
              return (
                <Pressable
                  key={post.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Read post: ${post.title}`}
                  style={s.postCard}
                  onPress={() => router.push(`/community/posts/${post.id}` as any)}
                >
                  {/* Author & Community Info */}
                  <View style={s.postMetaRow}>
                    <View style={s.authorRing}>
                      <Text style={s.authorInitial}>K</Text>
                    </View>
                    <View style={s.authorMeta}>
                      <View style={s.authorNameWrap}>
                        <Text style={s.authorName}>Karthik Vemula</Text>
                        <AppIcon name="verified-user" size={14} color={C.secondary} />
                      </View>
                      <Text style={s.commBadge}>{commName}</Text>
                    </View>
                    <Text style={s.postDate}>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Title & Body Snippet */}
                  <Text style={s.postTitle}>{post.title}</Text>
                  <Text style={s.postSnippet} numberOfLines={3}>
                    {post.body}
                  </Text>

                  {/* Reaction / Stat footer */}
                  <View style={s.postFooter}>
                    <View style={s.reactionPill}>
                      <Text style={s.reactionEmoji}>💡</Text>
                      <Text style={s.reactionNum}>Helpful</Text>
                    </View>
                    <View style={s.reactionPill}>
                      <Text style={s.reactionEmoji}>👍</Text>
                      <Text style={s.reactionNum}>Like</Text>
                    </View>
                    <View style={[s.reactionPill, s.reactionRight]}>
                      <AppIcon name="message" size={14} color={C.inkMuted} />
                      <Text style={s.reactionNum}>Comments</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* FAB on Mobile */}
      {!isDesktop && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create Post"
          style={s.fab}
          onPress={() => router.push('/community/create-post')}
        >
          <AppIcon name="plus" size={18} color="#FFF" />
          <Text style={s.fabText}>New Post</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
  },
  scrollContentDesktop: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  hubBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5EFE6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  hubLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  hubIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubTextGroup: {
    flex: 1,
  },
  hubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.secondary,
  },
  hubSubtitle: {
    fontSize: 12,
    color: C.inkMuted,
    marginTop: 2,
  },
  createPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginLeft: 10,
  },
  createPostBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.ink,
    height: '100%',
  },
  clearText: {
    fontSize: 14,
    color: C.inkMuted,
    fontWeight: '700',
  },
  topicScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  topicChip: {
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  topicChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  topicChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.ink,
  },
  topicChipTextActive: {
    color: '#FFF',
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
    marginBottom: 12,
  },
  circlesRow: {
    gap: 12,
    paddingBottom: 4,
  },
  circleCard: {
    width: 220,
    backgroundColor: C.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 6,
  },
  circleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  circleAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.goldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: C.goldText,
  },
  joinBtn: {
    borderWidth: 1,
    borderColor: C.secondary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  joinBtnActive: {
    backgroundColor: C.tealBg,
    borderColor: C.secondary,
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.secondary,
  },
  joinBtnTextActive: {
    color: C.secondary,
  },
  circleName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
  },
  circleDesc: {
    fontSize: 11,
    color: C.inkMuted,
    lineHeight: 16,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedCountText: {
    fontSize: 12,
    color: C.inkMuted,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: C.inkMuted,
  },
  emptyFeedBox: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  emptyFeedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
  },
  emptyFeedSub: {
    fontSize: 13,
    color: C.inkMuted,
  },
  feedList: {
    gap: 14,
    marginTop: 8,
  },
  postCard: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 10,
    shadowColor: '#2B3338',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.goldBg,
    borderWidth: 1.5,
    borderColor: '#D99B26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: C.goldText,
  },
  authorMeta: {
    flex: 1,
    gap: 2,
  },
  authorNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
  },
  commBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: C.secondary,
  },
  postDate: {
    fontSize: 11,
    color: C.inkMuted,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
    lineHeight: 20,
  },
  postSnippet: {
    fontSize: 13,
    color: C.inkMuted,
    lineHeight: 19,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reactionRight: {
    marginLeft: 'auto',
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionNum: {
    fontSize: 11,
    fontWeight: '600',
    color: C.inkMuted,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 999,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
