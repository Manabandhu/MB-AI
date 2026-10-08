import { apiFetch, parseJson, parseJsonOrThrow } from '@/lib/apiClient';

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
  return parseJsonOrThrow(await apiFetch('/api/v1/posts/communities'), 'Communities');
}

export async function getCommunity(id: string): Promise<Community> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/posts/communities/${encodeURIComponent(id)}`),
    'Community',
  );
}

export async function listPosts(communityId?: string): Promise<Post[]> {
  const url = communityId
    ? `/api/v1/posts/communities/${encodeURIComponent(communityId)}/posts`
    : '/api/v1/posts';
  return parseJsonOrThrow(await apiFetch(url), 'Posts');
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
  const response = await apiFetch(`/api/v1/posts/communities/${encodeURIComponent(id)}/join`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error(`Join community failed: ${response.status}`);
}

export async function leaveCommunity(id: string): Promise<void> {
  const response = await apiFetch(`/api/v1/posts/communities/${encodeURIComponent(id)}/leave`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error(`Leave community failed: ${response.status}`);
}
