---
name: manabandhu-immigration
description: Maintain ManaBandhu immigration resources, guides, checklists, FAQ, community Q&A, USCIS links, news, saved resources, citations, freshness, and disclaimers. Use for any change under the immigration module.
---

# Immigration

## Module Purpose and Ownership

Owns curated resources, guides, checklists, FAQ, community Q&A, USCIS links, news, saves, citations, freshness, and legal-information disclaimers.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/immigration` | `ImmigrationScreen` (`screenId="home"`) | catalog | loading, empty, error |
| `/immigration/resources` | `ResourcesScreen` | list | loading, empty, error |
| `/immigration/guides` | `GuidesScreen` | list | loading, empty, error |
| `/immigration/checklists` | `ChecklistsScreen` | list | loading, empty, error |
| `/immigration/faq` | `FaqScreen` | list | loading, empty, error |
| `/immigration/questions` | `QuestionsScreen` | list | loading, empty, error |
| `/immigration/uscis` | `UscisScreen` | list | loading, empty, error |
| `/immigration/news` | `ImmigrationNewsScreen` | list | loading, empty, error |
| `/immigration/saved` | `SavedResourcesScreen` | list | loading, empty, error |
| `/immigration/resources/[resourceId]` | `ResourceDetailScreen` | detail | loading, error |

## Component Inventory

- `ImmigrationScreen` - multi-mode screen driven by `screenId` prop
- `ResourcesScreen` - browse immigration resources with search
- `GuidesScreen` - step-by-step immigration guides
- `ChecklistsScreen` - immigration document checklists with checkboxes
- `FaqScreen` - frequently asked questions with search
- `QuestionsScreen` - community Q&A
- `UscisScreen` - USCIS updates and alerts
- `ImmigrationNewsScreen` - immigration policy news
- `SavedResourcesScreen` - saved immigration resources
- `ResourceDetailScreen` - resource details with disclaimer
- Shared: `FeatureScreen`, `ScreenShell`, `SearchBar`, `FilterBar`, `ListScreen`, `Card`, `AppButton`, `DetailScreen`, `SectionHeader`, `Checkbox`, `TextArea`, `EmptyState`, `ErrorState`, `LoadingState`

## API Surface

- `listImmigrationGuides(category?)` -> `GET /api/v1/immigration/guides`
- `listImmigrationNews()` -> `GET /api/v1/immigration/news` (USCIS view filters by source/category/url)
- `listImmigrationResources(category?)` -> `GET /api/v1/immigration/resources`
- `getImmigrationResource(id)` -> `GET /api/v1/immigration/resources/{id}`
- `listImmigrationChecklists(category?)` -> `GET /api/v1/immigration/checklists` (JWT)
- `listImmigrationFaq(category?)` -> `GET /api/v1/immigration/faq`
- External links open through `utils/openUrl.ts` (http/https only, failures shown with notify).

## Demo Fixtures

- Frontend fallbacks removed in favor of backend API endpoints and loading/empty/error states.

## State Patterns

- **Loading**: `LoadingState` while resources load
- **Empty**: `EmptyState` when no resources match
- **Error**: `ErrorState` with retry action
- **Success**: not applicable
- **Offline**: offline banner with cached data
- **Permission**: not applicable

## Navigation Actions and Cross-Module Links

- Home actions: Resources, Guides, Checklists, FAQ, Saved
- Resources -> Guides, FAQ, Saved
- Guides -> Resources, Checklists
- Checklists -> Guides, Resources
- FAQ -> Resources, Questions
- Questions -> FAQ, Resources
- USCIS -> News, Guides
- News -> USCIS alerts, Resources
- Saved -> Resources
- Resource detail -> back to resources

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/immigration/` are thin wrappers
- `ImmigrationScreen` uses `useQuery` with backend API data
- `FeatureScreen` provides adaptive catalog/list layout
- Content is treated as general information with disclaimers; not legal advice
- Search uses client-side filtering on demo data; backend search is pending

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Focus ring: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Safe area insets always respected
- Color is not the only indicator of state

## Current Implementation Status

- **Partial**: Home via `FeatureScreen` is complete. Dedicated list screens (resources, guides, checklists, FAQ, questions, USCIS, news, saved) and resource detail are UI-complete. Backend content freshness and citation linking are pending.
- **Backend**: REST and GraphQL APIs implemented under `/api/v1/immigration` with resources, guides, checklists, news, FAQ, and Flyway migration V10.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.

- Recent backend fixes: added missing `import com.manabandhu.backend.foundation.CatalogScreenContent;` to `ImmigrationController` so the `@GetMapping("/screens/{screenId}")` endpoint compiles against the `ImmigrationContentService` switch.
- Fallback cleanup: deleted `immigrationFallbacks.ts` and removed inline fallbacks from `ImmigrationScreen`, `ResourcesScreen`, `GuidesScreen`, `ChecklistsScreen`, `FaqScreen`, `QuestionsScreen`, `UscisScreen`, `ImmigrationNewsScreen`, and `SavedResourcesScreen` in favor of live backend endpoints, loading states, and error/empty states; added resilient `DEFAULT_IMMIGRATION_DATA` fallback to `ImmigrationScreen` to avoid mobile network blockages; updated detail route with `useLocalSearchParams`.
- Immigration Guidance Hub overhaul: replaced generic `FeatureScreen` placeholder in `ImmigrationHomeScreen.tsx` with dedicated Immigration & Visa Guidance Hub featuring live USCIS Visa Bulletin ticker (EB-2/EB-3 priority date cutoff tracker), category filter tabs (All, F-1 OPT/CPT, H-1B Cap, STEM Extension, Green Card), comprehensive guide cards with ratings and review counts, and verified immigration attorney consultation inquiry modal. Matching Stitch screen: `1eba8c2fb8b345578ba7af251f166ff8`.
- Repo-Wide Code Review & Defect Remediation: Audited resource detail dynamic route parameter handling (`/immigration/resources/[resourceId]`), added `hitSlop` on back buttons, and verified loading and error lifecycle states.
- Security & correctness hardening (2026-10): Community-submitted resources can no longer self-mark as verified (admins only). Added public `GET /api/v1/immigration/resources/{id}` for `ResourceDetailScreen`. Removed unrouted `QuestionsScreen`, `UscisScreen` and `SavedResourcesScreen`, which called endpoints that never existed, and the unreachable `ImmigrationGraphqlController`.
- Screen metrics are computed from the database (2026-10): `ImmigrationContentService` counts resources, verified resources, distinct categories, guides, checklists (plus the caller's own and completed when signed in), FAQ items, published FAQ items, `uscis.gov` resource links and news (total and published in the last 7 days); community Q&A and saved screens show no metrics.
- Editorial content (2026-10): guides and resources may have a null `owner_id` (V30) for platform-published content. Guides, official resources (uscis.gov, travel.state.gov, studyinthestates.dhs.gov, ssa.gov, irs.gov, ceac.state.gov, fmjfee.com) and FAQ items live in the database; the app never hard-codes immigration content, dates, or visa bulletin values.
- Cleanup: removed the unused `index.ts` barrel, unused API exports, and unused backend create-input records.
- Dates render with `formatDate` from `@manabandhu/core`.
- Public API: `immigration/index.ts` exports `moduleMeta` (launcher entry).
- P0 privacy fix (2026-10-10): `SecurityConfig` no longer opens `/api/v1/immigration/**`; only published content is public (`screens/{screenId}`, `resources`, `resources/{resourceId}`, `guides`, `faq`, `news`). `GET /api/v1/immigration/checklists` requires a JWT and returns only the caller's checklists (newest 200, optional `category`) through `ImmigrationChecklistService.findForOwner`; completing a checklist requires ownership. `ChecklistsScreen` shows a sign-in prompt to signed-out visitors. Unknown `resourceType` values on `POST /resources` return 400 (case-insensitive match).
- Review fix (2026-10-11): `GET /resources` and `/resources/{id}` return `ImmigrationResourceView` (no `ownerId`, adds `mine`). The lists are verified resources plus the caller's own unreviewed submissions (admins see all), newest 200; an unreviewed resource reads as 404 to everyone except its submitter and admins.
- Launcher keywords (2026-10-12): `module.ts` sets `keywords: ['visa', 'opt', 'stem opt', 'h1b', 'green card', 'uscis', 'f1', 'checklist']` (`ModuleMeta.keywords`), which Explore search matches by word prefix alongside the label, summary and category. Keep them to things this module does today.
- Phase 1 correctness pass (2026-10-14): `ResourceDetailScreen` uses `getImmigrationResource` (was raw `apiFetch`), shows the reviewed/not-reviewed state, opens the link in the browser, and no longer has the fake "Save resource" button (it routed to the "not available" screen). Guides expand to their `content` ("Read guide"). `/immigration/questions` no longer duplicates the FAQ: it sends people to ask in Community or read the FAQ. Every immigration route uses `Screen` + `ScreenHeader` (back on sub-routes) with pull-to-refresh; `Alert.alert` was replaced with notify. `/immigration/saved` stays an honest "not available yet" placeholder that nothing links to.
