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

- `CommunityHomeScreen` - catalog-style home showing joined communities with search and activity feed
- `CommunityDiscoverScreen` - discover new communities with search and filtering
- `CommunityJoinedScreen` - list of joined communities with search
- `CommunityDetailsScreen` - detail view for community showing posts and metadata
- `CreatePostScreen` - form to create a new post in a community
- `PostDetailsScreen` - detail view for post with comments section
- Shared: `ScreenShell`, `CatalogScreen`, `DetailScreen`, `FormScreen`, `SectionHeader`, `SearchBar`, `EmptyState`, `ErrorState`, `LoadingState`, `AppButton`, `TextArea`, `useAdaptiveLayout`

## API Surface

- `listCommunities()` -> `GET /api/v1/communities`
- `getCommunity(id)` -> `GET /api/v1/communities/{id}`
- `listPosts(communityId)` -> `GET /api/v1/communities/{id}/posts`
- `getPost(postId)` -> `GET /api/v1/communities/posts/{id}`
- `createPost(input)` -> `POST /api/v1/communities/posts`

## Demo Fixtures

- `frontend/src/modules/community/communityFallbacks.ts` - realistic demo data for all 6 community screens

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

- Recent backend changes: added `@GetMapping("/communities/{communityId}")` and `@GetMapping("/communities/{communityId}/posts")` to `CommunityPostController`; added `communityId` field to `CommunityPost` entity with new constructor; added `findCommunity()` and `findPostsByCommunity()` to `CommunityPostService`; added `findByCommunityIdOrderByCreatedAtDesc()` to `CommunityPostRepository`.
