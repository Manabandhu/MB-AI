import { apiFetch, parseJson, parseJsonOrThrow } from '@/lib/api';

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

export type ReactionType = 'LIKE' | 'HELPFUL' | 'HEART';

/** `PostView` from the backend: author display name, counts, and the signed-in viewer's own reaction. */
export type Post = {
  id: string;
  communityId: string | null;
  authorName: string;
  /** True when the signed-in viewer wrote it (the API never exposes user ids). */
  mine: boolean;
  title: string;
  body: string;
  createdAt: string;
  commentCount: number;
  /** Count per reaction type; a missing type is zero. */
  reactionCounts: Partial<Record<ReactionType, number>>;
  reactionCount: number;
  viewerReaction: ReactionType | null;
};

/** `CommentView` from the backend. */
export type Comment = {
  id: string;
  postId: string;
  authorName: string;
  mine: boolean;
  body: string;
  createdAt: string;
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

export async function getPost(postId: string): Promise<Post> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/posts/${encodeURIComponent(postId)}`), 'Post');
}

export async function listComments(postId: string): Promise<Comment[]> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/posts/${encodeURIComponent(postId)}/comments`),
    'Comments',
  );
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

/** Sets the caller's one reaction on the post (replacing an earlier one). */
export async function reactPost(postId: string, type: ReactionType): Promise<void> {
  const response = await apiFetch(`/api/v1/posts/${encodeURIComponent(postId)}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
  if (!response.ok) await parseJson(response);
}

/** Removes the caller's own reaction. */
export async function unreactPost(postId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/posts/${encodeURIComponent(postId)}/reactions`, {
    method: 'DELETE',
  });
  if (!response.ok) await parseJson(response);
}

export async function joinCommunity(id: string): Promise<void> {
  const response = await apiFetch(`/api/v1/posts/communities/${encodeURIComponent(id)}/join`, {
    method: 'POST',
  });
  if (!response.ok) await parseJson(response);
}

export async function leaveCommunity(id: string): Promise<void> {
  const response = await apiFetch(`/api/v1/posts/communities/${encodeURIComponent(id)}/leave`, {
    method: 'POST',
  });
  if (!response.ok) await parseJson(response);
}

/** Feeds return at most this many of the newest posts; screens say so when a list is full. */
export const FEED_LIMIT = 100;

/** Query-key prefixes every community mutation refreshes (lists, details, the Community tab and home widgets). */
export const COMMUNITY_QUERY_PREFIXES = [['communities'], ['community']] as const;
