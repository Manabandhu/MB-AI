---
name: manabandhu-community
description: Maintain ManaBandhu community capabilities including posts, profiles, relationships, help requests, skill exchange, discovery, and their frontend/backend contracts. Use for changes to the community frontend module or Spring post/community domain.
---

# Community

## Module Purpose and Ownership

Owns Community Home, Discover, Joined Communities, Community Details, Create Post, Post Details, relationships, help requests, and skill exchanges. Spring domain logic remains in its owning backend package.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/community` | `CommunityHomeScreen` | catalog | loading, empty, error |
| `/community/discover` | `CommunityDiscoverScreen` | list | loading, empty, error |
| `/community/joined` | `CommunityJoinedScreen` | list | loading, empty, error |
| `/community/[communityId]` | `CommunityDetailsScreen` | detail | loading, error |
| `/community/create-post` | `CreatePostScreen` | form | normal, error, success, loading |
| `/community/posts/[postId]` | `PostDetailsScreen` | detail | loading, error, empty |

## Component Inventory

- `CommunityDiscoverScreen` / `CommunityJoinedScreen` - thin wrappers over `components/CommunityListScreen` (search, tappable `CommunityRow`, in-place join/leave)
- `CommunityDetailsScreen` - community header, join/leave (leave confirms, red), posts as `components/PostCard`
- `CreatePostScreen` - community picker (joined communities plus the `?communityId=` one), title, body; opens the new post
- `PostDetailsScreen` - author (`PersonRow`), body, live reactions (`Chip` with counts, yours selected; tap again to remove), share via `lib/share`, comments with their own error state
- `hooks.ts` `useMembershipToggle` - join/leave mutation with confirm and invalidation; `utils/reactions.ts` - `nextReaction`, `withViewerReaction` (optimistic update)
- Shared: `Screen`, `ScreenHeader`, `Card`, `Chip`, `FilterChipRow`, `PersonRow`, `TextField`, `StatusBadge`, `IconButton`, `useConfirm`, notify, `EmptyState`/`ErrorState`/`LoadingState`

## API Surface

- `listCommunities()` -> `GET /api/v1/posts/communities` (`CommunityView`)
- `getCommunity(id)` -> `GET /api/v1/posts/communities/{id}`
- `listPosts(communityId?)` -> `GET /api/v1/posts/communities/{id}/posts` or `GET /api/v1/posts` (`PostView[]`)
- `getPost(postId)` -> `GET /api/v1/posts/{id}` (`PostView`)
- `listComments(postId)` -> `GET /api/v1/posts/{id}/comments` (`CommentView[]`, newest first; errors surface)
- `createPost({communityId, title, body})` -> `POST /api/v1/posts` (404 for an unknown community)
- `addComment(postId, body)` -> `POST /api/v1/posts/{id}/comments` (404 for a missing post)
- `reactPost(postId, type)` -> `POST /api/v1/posts/{id}/reactions` (`LIKE`/`HELPFUL`/`HEART`, case-insensitive, else 400; one per user, replaced)
- `unreactPost(postId)` -> `DELETE /api/v1/posts/{id}/reactions` (removes only the caller's reaction; 204, idempotent)
- `joinCommunity` / `leaveCommunity` -> `POST /api/v1/posts/communities/{id}/join|leave`
- `PostView` = `{id, communityId, authorName, mine, title, body, createdAt, commentCount, reactionCounts{TYPE: n}, reactionCount, viewerReaction}`; `CommentView` = `{id, postId, authorName, mine, body, createdAt}`. Public views never carry user ids; `mine` is computed from the viewer. `GET /posts/{id}/reactions` returns `[{type, count}]` (no user ids).
- Feeds (`GET /posts`, `/posts/communities/{id}/posts`) return the newest 100 posts (`CommunityPostReader.FEED_LIMIT`, `FEED_LIMIT` in `api.ts`); screens say "Showing the latest 100" when a list is full. Comments return the newest 200.
- Only members can post (`CommunityPostService.create` → 403 "Join this community to post in it"); creating a community does not join it. `CreatePostScreen` offers joined communities only.
- Reads go through `CommunityPostReader` (one `@Transactional(readOnly)` load of posts/comments plus counts); `CommunityPostService` then resolves names with `AuthorNameService` after that transaction returned, so a request never holds two pooled connections. `AuthorNameService` reads `auth.users` metadata `nickname`, else the first word of `full_name`/`name`, else "Member" (never email or full name), in batches of 500 (never truncated); a lookup failure degrades to "Member". GraphQL still returns the raw entities (lists capped at 100/200).
- Mutations invalidate the `['communities']` and `['community']` prefixes (`COMMUNITY_QUERY_PREFIXES`).

## Demo Fixtures

- Demo fixtures removed; screens use live backend queries, loading states, and error/empty states.

## State Patterns

- **Loading**: skeleton cards/rows while data loads
- **Empty**: `EmptyState` with action to discover or create post
- **Error**: `ErrorState` with retry action
- **Success**: navigation back to community or post detail after create
- **Offline**: offline banner with cached data
- **Permission**: not applicable

## Navigation Actions and Cross-Module Links

- Home -> Discover -> Joined -> Details -> Create Post -> Post Details
- Back navigation from details to community home
- Deep links to community from explore and saved

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/community/` are thin wrappers
- Uses `useQuery` and `useMutation` from `@tanstack/react-query`
- Forms use `react-hook-form` + `zod` + `@hookform/resolvers`
- Styling uses `StyleSheet` + Tailwind utilities via `uniwind`
- `useAdaptiveLayout` governs responsive max-width and columns

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Focus ring: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Safe area insets always respected

## Current Implementation Status

- **Partial**: Community home, discover, joined, details, create post, and post details screens are implemented. Backend moderation and visibility rules are enforced server-side. Some community/post CRUD is UI-complete pending full backend wiring.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.

- Recent fixes: aligned frontend `api.ts` to backend paths (`/api/v1/posts/communities`, `/api/v1/posts/{id}`, `/api/v1/posts/{id}/comments`); added `communityId` to `CreatePostInput` and updated `CommunityPostService.create()`; added V17 migration adding `community_id` column to `community_posts`; fixed `PostDetailsScreen` to use real comments from `getPost` response instead of hardcoded mock data; added `addComment`, `reactPost`, `joinCommunity`, `leaveCommunity` API functions.

- Recent fixes: added `authorName?: string` to the `Comment` type so `PostDetailsScreen` (`c.authorName`) typechecks.

- Recent backend changes: added `@GetMapping("/communities/{communityId}")` and `@GetMapping("/communities/{communityId}/posts")` to `CommunityPostController`; added `communityId` field to `CommunityPost` entity with new constructor; added `findCommunity()` and `findPostsByCommunity()` to `CommunityPostService`; added `findByCommunityIdOrderByCreatedAtDesc()` to `CommunityPostRepository`; added `@GetMapping("/{postId}")` to `CommunityPostController` and `findById` in `CommunityPostService`; configured public GET access in `SecurityConfig`.

- Fallback cleanup: deleted `communityFallbacks.ts` and removed inline fallbacks from `CommunityDiscoverScreen`, `CommunityJoinedScreen`, `CommunityDetailsScreen`, and `CreatePostScreen` in favor of live queries, loading states, and responsive error/empty states.
- Hardcoded data cleanup: removed hardcoded author name ("Karthik Vemula") and initial "K" from `CommunityHomeScreen` and `PostDetailsScreen` in favor of dynamic author derivation from post entities; replaced static school assurance text with generic community moderation notice; replaced hardcoded comment upvote counts with dynamic actions.
- Post Composer overhaul: completely replaced legacy `FormScreen` in `CreatePostScreen.tsx` with a modern community composer featuring category selector pills (*General*, *Housing*, *Rides*, *Jobs*, *Culture*, *Legal*), live character counters, suggested topic tags (`#Austin`, `#UTAustin`, `#H1B`, etc.), community standards guidelines, and brand-aligned tactile CTAs.
- Repo-Wide Code Review & Defect Remediation: Added `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` to header back buttons; enforced `keyboardShouldPersistTaps="handled"` on `CreatePostScreen.tsx` ScrollView; verified defensive parameter guards on `PostDetailsScreen.tsx` (`if (!postId)` and `if (error || !postData)`).
- City & Campus Spaces & Media Posts: Enhanced `communities` with diaspora hubs (Dallas–Fort Worth, UT Dallas, Bay Area, Greater Chicago) and `community_members` joining. Upgraded `CommunityDetailsScreen` with 1-click Join/Leave toggle and real member metrics. Integrated image attachment picker via `expo-image-picker` in `CreatePostScreen` with image previews and tag chips. Category filters on `CommunityHomeScreen` support `Housing & Subleases`, `Carpools`, `General Discussion`, and `Tech & Jobs`.
- Security & correctness hardening (2026-10): Communities return `CommunityView` (`memberCount`, `category`, `isJoined`, `slug`, `metroArea`, `image`). Added `POST /api/v1/posts/communities/{id}/join|leave` (idempotent, `CommunityMembershipService`, updates `member_count` only on real changes). The frontend no longer falls back to direct Supabase table access, surfaces load errors, and derives join state from the server. GraphQL `Community.ownerId` is nullable for seeded hubs.
- Reaction rollback (2026-10 review): `reactPost` throws on non-2xx and `PostDetailsScreen` reverts the optimistic like when the request fails.
- Cleanup: deleted the unused `CommunityHomeScreen.tsx`; the `/community` tab is `foundation/screens/shell/CommunityShell.tsx`. Removed unused `PostCommentRepository` methods.
- Public API: `community/index.ts` exports `moduleMeta`, `CommunityHomeWidget` (three latest posts), and `listPosts`/`Post` for the foundation Community tab.
- The Home widget query sets `meta: persistMeta` (public listings only) so it survives app restarts for 24 h.
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
- Launcher keywords (2026-10-12): `module.ts` sets `keywords: ['groups', 'posts', 'questions', 'advice', 'forum', 'discussion']` (`ModuleMeta.keywords`), which Explore search matches by word prefix alongside the label, summary and category. Keep them to things this module does today.
- Phase 1 correctness pass (2026-10-14): fixed the post route (`/community/posts/{id}`, was `/community/post/`); removed hardcoded reaction counts, the fake un-react, fake share alert, local-only save, fake verified badge, the pinned moderation card, dead "Top Answers"/Reply, the `'c1'` community fallback, local image URIs (no `image_url` column, so images were removed), and tags/categories (the backend never stored them). Backend: `PostView`/`CommentView`, `AuthorNameService`, `DELETE /posts/{id}/reactions`, reaction type validation, 404s for missing posts/communities; service tests in `CommunityPostServiceTest` and post checks in `authz-smoke.mjs`. No migration.
