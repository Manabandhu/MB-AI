import type { Post, ReactionType } from '../api';

/** Reactions the backend accepts, in display order. */
export const REACTIONS: readonly { type: ReactionType; label: string }[] = [
  { type: 'HELPFUL', label: 'Helpful' },
  { type: 'LIKE', label: 'Like' },
  { type: 'HEART', label: 'Love' },
];

/**
 * What pressing a reaction does: pressing your current reaction removes it (`null`), anything else becomes your
 * one reaction.
 */
export function nextReaction(current: ReactionType | null, pressed: ReactionType) {
  return current === pressed ? null : pressed;
}

/** The post as it will look after the viewer's reaction changes to `next`; used for the optimistic update. */
export function withViewerReaction(post: Post, next: ReactionType | null): Post {
  const counts = { ...post.reactionCounts };
  const previous = post.viewerReaction;
  if (previous === next) return post;
  if (previous) counts[previous] = Math.max(0, (counts[previous] ?? 0) - 1);
  if (next) counts[next] = (counts[next] ?? 0) + 1;
  const total = Object.values(counts).reduce((sum, value) => sum + (value ?? 0), 0);
  return { ...post, reactionCounts: counts, reactionCount: total, viewerReaction: next };
}
