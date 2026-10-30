# Frontend modules

Each business capability owns a folder here. Keep Expo Router files in `src/app` thin and place feature screens, components, API adapters, schemas, state, hooks, and tests in the owning module.

Modules may import `src/lib`, `src/platform`, shared design-system packages, and API contracts. Avoid importing another module's internal files; expose intentional public APIs from that module's `index.ts` when cross-module collaboration becomes necessary.

Shared client UI primitives live in `shared/ui` and are built on Tamagui with design-system tokens (`AppText`, `AppButton`, `Card`, `ListRow`, `Chip`, `TextField`, `Screen`, `Section`, `ResponsiveGrid`, `Skeleton`, `BrandLogo`, …; barrel `shared/ui/index.ts`). Use them before writing screen-local controls. Icons go through `AppIcon`, which maps semantic names to Lucide icons, so a future library swap stays in one file.

Each business module exposes a public `index.ts` (its `moduleMeta` from `module.ts`, plus any Home widget or helper other modules need). Import another module only through that file. Platform-free logic shared by every client (HTTP client, formatters, module metadata types) lives in `packages/core`.

`screen-catalog.ts` is the canonical product screen inventory. Current business folders are foundation, auth, notifications, rooms, rides, jobs, referrals, community, chat, immigration, expenses, events, marketplace, utilities, safety, and admin. Technical AI and analytics modules remain separate cross-cutting boundaries.
