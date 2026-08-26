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

- `getImmigrationScreen(screenId)` -> `GET /api/v1/immigration/screens/{screenId}`
- `getResources(query?)` -> `GET /api/v1/immigration/resources?q={query}`
- `getGuides()` -> `GET /api/v1/immigration/guides`
- `getChecklists()` -> `GET /api/v1/immigration/checklists`
- `getFaq(query?)` -> `GET /api/v1/immigration/faq?q={query}`
- `getQuestions()` -> `GET /api/v1/immigration/questions`
- `getUscis()` -> `GET /api/v1/immigration/uscis`
- `getNews()` -> `GET /api/v1/immigration/news`
- `getSaved()` -> `GET /api/v1/immigration/saved`
- `getResourceDetail(resourceId)` -> `GET /api/v1/immigration/resources/{resourceId}`

## Demo Fixtures

- `frontend/src/modules/immigration/immigrationFallbacks.ts` - demo fixtures for all immigration screens

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
- `ImmigrationScreen` uses `useQuery` with fallback data from `immigrationFallbacks.ts`
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
