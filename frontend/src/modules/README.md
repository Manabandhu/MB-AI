# Frontend modules

Each business capability owns a folder here. Keep Expo Router files in `src/app` thin and place feature screens, components, API adapters, schemas, state, hooks, and tests in the owning module.

Modules may import `src/lib`, `src/platform`, shared design-system packages, and API contracts. Avoid importing another module's internal files; expose intentional public APIs from that module's `index.ts` when cross-module collaboration becomes necessary.

Shared client UI primitives live in `shared/ui`. Prefer Gluestack-backed primitives such as `AppButton`, generated components under `shared/ui/gluestack`, and `AppIcon` before writing screen-local controls; icons use `iconoir-react-native` through the app wrapper so future library swaps stay localized.

`screen-catalog.ts` is the canonical product screen inventory. Current business folders are foundation, auth, notifications, rooms, rides, jobs, referrals, community, chat, immigration, expenses, events, marketplace, utilities, safety, and admin. Technical AI and analytics modules remain separate cross-cutting boundaries.
