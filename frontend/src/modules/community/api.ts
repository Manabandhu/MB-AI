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
  body: string;
  createdAt: string;
};

export async function listCommunities(): Promise<Community[]> {
  return parseJson(await apiFetch('/api/v1/communities'));
}

export async function getCommunity(id: string): Promise<Community> {
  return parseJson(await apiFetch(`/api/v1/communities/${encodeURIComponent(id)}`));
}

export async function listPosts(communityId: string): Promise<Post[]> {
  return parseJson(await apiFetch(`/api/v1/communities/${encodeURIComponent(communityId)}/posts`));
}

export async function getPost(postId: string): Promise<Post & { comments: Comment[] }> {
  return parseJson(await apiFetch(`/api/v1/communities/posts/${encodeURIComponent(postId)}`));
}

export async function createPost(input: {
  communityId: string;
  title: string;
  body: string;
}): Promise<Post> {
  return parseJson(
    await apiFetch('/api/v1/communities/posts', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}
