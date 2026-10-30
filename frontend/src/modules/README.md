# Frontend modules

Each business capability owns a folder here. Keep Expo Router files in `src/app` thin and place feature screens, components, API adapters, schemas, state, hooks, and tests in the owning module.

Modules may import `src/lib`, `src/platform`, shared design-system packages, and API contracts. Avoid importing another module's internal files; expose intentional public APIs from that module's `index.ts` when cross-module collaboration becomes necessary.

Shared client UI primitives live in `shared/ui` and are built on Tamagui with design-system tokens (`AppText`, `AppButton`, `Card`, `ListRow`, `Chip`, `TextField`, `Screen`, `Section`, `ResponsiveGrid`, `Skeleton`, `BrandLogo`, …; barrel `shared/ui/index.ts`). Use them before writing screen-local controls. Icons go through `AppIcon`, which maps semantic names to Lucide icons, so a future library swap stays in one file.

Each module exposes a public `index.ts` (its `moduleMeta` from `module.ts`, plus any Home widget, function, or type another module needs). Import another module only through that file. Platform-free logic shared by every client (HTTP client, formatters, module metadata and catalog types) lives in `packages/core`.

## Layers

Imports only go downwards; `pnpm verify:boundaries` (also in CI) fails on a deep import into another module or an
import from a higher layer.

1. `shared` (UI primitives, shared hooks, stores and utils), plus `src/lib`, `src/platform`, `src/theme`
2. `notifications`
3. `onboarding`
4. `auth`
5. Feature modules (rooms, rides, jobs, referrals, community, chat, events, marketplace, expenses, immigration,
   utilities, safety, ai-assistant, admin). They may use each other's public API (for example jobs → referrals).
6. `foundation`, the app shell, organised by sub-feature (see `foundation/MODULE.md`). Only
   `foundation/launcher/` may import another module's `module.ts` directly.

Route files in `src/app` stay thin and may import a module's screen file directly.

## Module layout

Every module uses the same folders; create one only when it has a file.

| Path | Holds |
| --- | --- |
| `api.ts` (+ topic files such as `rides/mapsApi.ts`) | Backend calls through `apiFetch` from `@/lib/api` |
| `types.ts` | Response and domain types |
| `screens/` | Route-level screens (imported by `src/app` route files) |
| `components/` | Module-specific components |
| `hooks/` | React hooks (`hooks/index.ts` for small modules) |
| `stores/` | Zustand stores |
| `utils/` | Pure helpers and formatters (unit-tested in `frontend/test`) |
| `home/` | Home widgets |
| `module.ts` / `index.ts` | Launcher metadata and the public API |
| `MODULE.md` | Ownership notes |

Format dates, times, numbers, and money with `@manabandhu/core` (`formatDate`, `formatTime`, `formatNumber`, `formatMoney`, …) so the user's language applies; do not call `toLocale*String` directly. Show messages and confirmations with `@/modules/shared/ui/notify`.

`screen-catalog.ts` is the canonical product screen inventory. Current business folders are foundation, auth, notifications, rooms, rides, jobs, referrals, community, chat, immigration, expenses, events, marketplace, utilities, safety, ai-assistant, onboarding, and admin.
