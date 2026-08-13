# ManaBandhu agent rules

Before changing a governed module, read its skill in `.codex/skills/`. Update that `SKILL.md` in the same commit whenever behavior, contracts, paths, architecture, invariants, dependencies, commands, or ownership change.

Use the narrowest applicable skills:

- Expo surfaces: `manabandhu-mobile-platform`
- Spring services: `manabandhu-backend-api`
- OpenAPI, GraphQL, AsyncAPI: `manabandhu-api-contracts`
- Boundaries and ADRs: `manabandhu-architecture`
- Tokens and components: `manabandhu-design-system`
- Notifications: `manabandhu-notifications`
- AI assistant/bot: `manabandhu-ai`
- Authentication and sessions: `manabandhu-auth`
- Community and posts: `manabandhu-community`
- App shell and core journeys: `manabandhu-foundation`
- Rooms: `manabandhu-rooms`
- Rides: `manabandhu-rides`
- Jobs: `manabandhu-jobs`
- Referrals: `manabandhu-referrals`
- Immigration resources: `manabandhu-immigration`
- Shared expenses: `manabandhu-expenses`
- Events: `manabandhu-events`
- Marketplace: `manabandhu-marketplace`
- Utilities: `manabandhu-utilities`
- Safety: `manabandhu-safety`
- Human or bot chat: `manabandhu-chat`
- Analytics: `manabandhu-analytics`
- CI/CD and releases: `manabandhu-deployments`
- Logs, metrics, traces, alerts: `manabandhu-observability`
- Super Admin and automation control plane: `manabandhu-super-admin`

Run `pnpm verify:skills` before handing off changes. Contract changes must also run `pnpm verify:contracts`.

Current client targets are native phone/tablet/foldable, mobile browser, tablet browser, and desktop web. Watch and TV are future targets: preserve boundaries, but do not add runtime dependencies for them yet.
