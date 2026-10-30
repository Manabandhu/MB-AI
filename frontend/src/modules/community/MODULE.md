# Community

Owns Discover, Joined Communities, Community Details, Create Post, and Post Details. The `/community` tab is `foundation/shell/tabs/CommunityTab.tsx`.

## Routes
- `/community/discover` -> `CommunityDiscoverScreen` (`components/CommunityListScreen` mode `discover`)
- `/community/joined` -> `CommunityJoinedScreen` (mode `joined`)
- `/community/[communityId]` -> `CommunityDetailsScreen`
- `/community/create-post` -> `CreatePostScreen` (`?communityId=` preselects)
- `/community/posts/[postId]` -> `PostDetailsScreen`

## API
See `.codex/skills/manabandhu-community/SKILL.md` (API Surface): `PostView`/`CommentView` with author name, counts and the viewer's reaction; `DELETE /api/v1/posts/{id}/reactions` removes your reaction.

## Rules
- No sample data: lists show loading, error (with the server message), or empty states.
- Leaving a community confirms first (destructive). Every mutation invalidates `['communities']` and `['community']`.
- Images and tags are not supported by the backend and are not offered.
