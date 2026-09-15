import { apiFetch, parseJson } from '@/lib/apiClient';
import { supabase } from '@/lib/supabase';

export type Community = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  image?: string;
  isJoined: boolean;
  slug?: string;
  metroArea?: string;
};

export type Post = {
  id: string;
  communityId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  body: string;
  createdAt: string;
  commentCount: number;
  likeCount: number;
  tags?: string[];
  imageUrl?: string;
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  authorName?: string;
  body: string;
  createdAt: string;
  parentId?: string;
  isVerifiedAuthor?: boolean;
};

export async function listCommunities(): Promise<Community[]> {
  try {
    const res = await apiFetch('/api/v1/posts/communities');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}

  // Supabase fallback
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false });
    if (!error && data && data.length > 0) {
      return data.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        memberCount: c.member_count || 0,
        category: c.category || 'CITY',
        metroArea: c.metro_area,
        image: c.cover_url || c.avatar_url,
        isJoined: false,
      }));
    }
  } catch {}

  return [];
}

export async function getCommunity(id: string): Promise<Community> {
  try {
    const res = await apiFetch(`/api/v1/posts/communities/${encodeURIComponent(id)}`);
    if (res.ok) return await res.json();
  } catch {}

  const { data } = await supabase.from('communities').select('*').eq('id', id).maybeSingle();
  if (data) {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      memberCount: data.member_count || 0,
      category: data.category || 'CITY',
      metroArea: data.metro_area,
      image: data.cover_url || data.avatar_url,
      isJoined: false,
    };
  }
  throw new Error('Community not found');
}

export async function listPosts(communityId?: string): Promise<Post[]> {
  try {
    const url = communityId
      ? `/api/v1/posts/communities/${encodeURIComponent(communityId)}/posts`
      : '/api/v1/posts';
    const res = await apiFetch(url);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function getPost(postId: string): Promise<Post & { comments: Comment[] }> {
  const post = await parseJson<Post>(await apiFetch(`/api/v1/posts/${encodeURIComponent(postId)}`));
  let comments: Comment[] = [];
  try {
    comments = await parseJson<Comment[]>(
      await apiFetch(`/api/v1/posts/${encodeURIComponent(postId)}/comments`),
    );
  } catch {
    comments = [];
  }
  return { ...post, comments };
}

export async function createPost(input: {
  communityId: string;
  title: string;
  body: string;
  tags?: string[];
  imageUrl?: string;
}): Promise<Post> {
  return parseJson(
    await apiFetch('/api/v1/posts', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}

export async function addComment(
  postId: string,
  body: string,
  parentId?: string,
): Promise<Comment> {
  return parseJson(
    await apiFetch(`/api/v1/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body, parentId }),
    }),
  );
}

export async function reactPost(postId: string, type: string = 'LIKE'): Promise<void> {
  await apiFetch(`/api/v1/posts/${encodeURIComponent(postId)}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
}

export async function joinCommunity(id: string): Promise<void> {
  try {
    await apiFetch(`/api/v1/posts/communities/${encodeURIComponent(id)}/join`, { method: 'POST' });
  } catch {}
  try {
    const user = (await supabase.auth.getUser()).data?.user;
    if (user) {
      await supabase.from('community_members').upsert({ community_id: id, user_id: user.id });
    }
  } catch {}
}

export async function leaveCommunity(id: string): Promise<void> {
  try {
    await apiFetch(`/api/v1/posts/communities/${encodeURIComponent(id)}/leave`, { method: 'POST' });
  } catch {}
  try {
    const user = (await supabase.auth.getUser()).data?.user;
    if (user) {
      await supabase
        .from('community_members')
        .delete()
        .eq('community_id', id)
        .eq('user_id', user.id);
    }
  } catch {}
}
