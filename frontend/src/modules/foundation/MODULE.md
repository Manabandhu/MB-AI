# Foundation

The app shell. Owns splash and welcome, the tab shell, Home, Explore (launcher), global search, saved aggregation,
account and settings. It sits on top of every other module: it may import any module through that module's
`index.ts`, and no module imports foundation (`pnpm verify:boundaries`). Onboarding, authentication (including the
Terms/Privacy documents and sign-out) and notifications are their own modules.

Foundation is organised by sub-feature; each folder holds its screen and helpers.

| Folder | Contents |
|---|---|
| `entry/` | `SplashScreen` (`/`, `/splash`), `WelcomeScreen` (`/welcome`) |
| `shell/` | `TabsLayout`, `TabHeader`, `UnreadNotificationDot`, `api.ts` (catalog screen data), `navigation/` (tab bar, nav rail, top nav, badges), `tabs/` (Chat, Community, Explore, Profile tabs) |
| `home/` | `HomeScreen` (`/home`), header, quick access, widget registry and boundary, nickname nudge |
| `launcher/` | Module registry (reads each module's `module.ts`), ranking and Explore filters |
| `search/` | `SearchScreen` (`/search`), `rankSearch` |
| `saved/` | `SavedScreen` (`/saved`) |
| `settings/` | `SettingsScreen` (`/settings`), `AppearanceSettings` |
| `account/` | `AccountDataScreen`, `ReauthSheet`, `reauth`, `api.ts` (export and deletion) |
| `location/` | `LocationSelectorModal` (Home city picker) |
| `stores/` | `userActivityStore` |

Shared controls come from `frontend/src/modules/shared/ui`.
