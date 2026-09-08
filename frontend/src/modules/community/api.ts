import { apiFetch, parseJson } from '@/lib/apiClient';

export type Community = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  image?: string;
  isJoined: boolean;
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
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  authorName?: string;
  body: string;
  createdAt: string;
};

export async function listCommunities(): Promise<Community[]> {
  return parseJson(await apiFetch('/api/v1/posts/communities'));
}

export async function getCommunity(id: string): Promise<Community> {
  return parseJson(await apiFetch(`/api/v1/posts/communities/${encodeURIComponent(id)}`));
}

export async function listPosts(communityId: string): Promise<Post[]> {
  return parseJson(
    await apiFetch(`/api/v1/posts/communities/${encodeURIComponent(communityId)}/posts`),
  );
}

export async function getPost(postId: string): Promise<Post & { comments: Comment[] }> {
  const post = await parseJson<Post>(await apiFetch(`/api/v1/posts/${encodeURIComponent(postId)}`));
  const comments = await parseJson<Comment[]>(
    await apiFetch(`/api/v1/posts/${encodeURIComponent(postId)}/comments`),
  );
  return { ...post, comments };
}

export async function createPost(input: {
  communityId: string;
  title: string;
  body: string;
}): Promise<Post> {
  return parseJson(
    await apiFetch('/api/v1/posts', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}

export async function addComment(postId: string, body: string): Promise<Comment> {
  return parseJson(
    await apiFetch(`/api/v1/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  );
}

export async function reactPost(postId: string, type: string): Promise<void> {
  await apiFetch(`/api/v1/posts/${encodeURIComponent(postId)}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
}

export async function joinCommunity(id: string): Promise<void> {
  await apiFetch(`/api/v1/posts/communities/${encodeURIComponent(id)}/join`, { method: 'POST' });
}

export async function leaveCommunity(id: string): Promise<void> {
  await apiFetch(`/api/v1/posts/communities/${encodeURIComponent(id)}/leave`, { method: 'POST' });
}
