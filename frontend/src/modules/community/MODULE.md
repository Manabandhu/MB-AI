# Community

Owns Community Home, Discover, Joined Communities, Community Details, Create Post, Post Details, relationships, help requests, and skill exchanges.

## Routes
- `/community` -> `CommunityHomeScreen`
- `/community/discover` -> `CommunityDiscoverScreen`
- `/community/joined` -> `CommunityJoinedScreen`
- `/community/[communityId]` -> `CommunityDetailsScreen`
- `/community/create-post` -> `CreatePostScreen`
- `/community/posts/[postId]` -> `PostDetailsScreen`

## Screens
- `CommunityHomeScreen` - Catalog-style home showing joined communities with search and activity feed.
- `CommunityDiscoverScreen` - Discover new communities with search and filtering.
- `CommunityJoinedScreen` - List of communities the user has joined with search.
- `CommunityDetailsScreen` - Detail view for a community showing posts and metadata.
- `CreatePostScreen` - Form to create a new post in a community.
- `PostDetailsScreen` - Detail view for a post with comments section.

## API
- `listCommunities()` -> `GET /api/v1/communities`
- `getCommunity(id)` -> `GET /api/v1/communities/{id}`
- `listPosts(communityId)` -> `GET /api/v1/communities/{id}/posts`
- `getPost(postId)` -> `GET /api/v1/communities/posts/{id}`
- `createPost(input)` -> `POST /api/v1/communities/posts`

## Fallbacks
- Fallbacks removed; screens use live API queries, loading states, and error/empty states.

## Components Used
- `ScreenShell` / `SafeAreaView` - page container
- `CatalogScreen` - card grid for home/discover
- `DetailScreen` - community and post detail headers
- `FormScreen` - create post form layout
- `SectionHeader` - section titling
- `SearchBar` - community search input
- `EmptyState` / `ErrorState` / `LoadingState` - state handling
- `AppButton` - navigation actions
- `TextArea` - post body and comment input
- `useAdaptiveLayout` - responsive max-width and columns
