import type { Href } from 'expo-router';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { HomeShellData } from '@/modules/foundation/homeApi';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { colors, s } from './theme';

const communityTabs = ['Feed', 'Groups', 'Events'];

export function CommunityShell({
  data,
  isDesktop: _isDesktop,
}: {
  data: HomeShellData;
  isDesktop: boolean;
}) {
  const [activeTab, setActiveTab] = useState('Feed');
  const feedPosts = (data?.feed ?? []).filter((item) => item.kind === 'post');

  return (
    <>
      <View style={s.communityHeader}>
        <Text style={s.chatTitle}>Community</Text>
        <View style={s.communityHeaderActions}>
          <Pressable onPress={() => router.push('/search')} style={s.headerIconBtn}>
            <AppIcon color={colors.appPrimary} name="search" size={16} />
          </Pressable>
          <Pressable onPress={() => router.push('/community/create-post')} style={s.composeBtn}>
            <AppIcon color="#fff" name="plus" size={16} />
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillRow}>
        {communityTabs.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[s.commTab, activeTab === tab && s.commTabActive]}
          >
            <Text style={[s.commTabText, activeTab === tab && s.commTabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {feedPosts.length > 0 ? (
        feedPosts.map((post) => (
          <Link key={post.id} href={post.route as Href} asChild>
            <Pressable style={s.postCard}>
              <Text style={s.postName}>{post.title}</Text>
              <Text style={s.postBody}>{post.body}</Text>
              <Text style={s.postTime}>{post.meta}</Text>
            </Pressable>
          </Link>
        ))
      ) : (
        <Link href="/community" asChild>
          <Pressable style={s.postCard}>
            <Text style={s.postName}>Welcome to the Community</Text>
            <Text style={s.postBody}>
              Join circles, share advice, discuss schools, and participate in local conversations.
            </Text>
          </Pressable>
        </Link>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create post"
        onPress={() => router.push('/community/create-post')}
        style={s.fab}
      >
        <AppIcon color="#fff" name="plus" size={22} />
      </Pressable>
    </>
  );
}

// ─── PROFILE SHELL ────────────────────────────────────────────────────────────
