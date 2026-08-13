---
name: manabandhu-community
description: Maintain ManaBandhu community capabilities including posts, profiles, relationships, help requests, skill exchange, discovery, and their frontend/backend contracts. Use for changes to the community frontend module or Spring post/community domain.
---

# Community

1. Read `frontend/src/modules/community/MODULE.md` and the affected REST or GraphQL contract before implementation.
2. Keep community screens, components, queries, mutations, schemas, and state inside `frontend/src/modules/community`; keep Spring domain logic in its owning backend package.
3. Derive ownership from authenticated identity, enforce visibility and moderation server-side, and avoid exposing unnecessary personal data.
4. Design loading, empty, error, pagination, optimistic update, offline, accessibility, and responsive states.
5. Prefer additive contracts and bounded queries with stable pagination and indexes.
6. Run contract verification, frontend checks, backend tests, and affected exports.
7. Update this skill with community behavior, paths, contracts, moderation, privacy, or ownership changes.
