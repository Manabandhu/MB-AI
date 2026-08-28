---
name: manabandhu-jobs
description: Maintain ManaBandhu job discovery, search, filters, saves, details, job posting, employer context, reporting, and moderation. Use for any change under the jobs module or its contracts.
---

# Jobs

## Module Purpose and Ownership

Owns job discovery, search, filters, saves, job details, posting, employer context, reporting, and moderation handoff.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/jobs` | `JobsScreen` (`screenId="home"`) | catalog | loading, empty, error |
| `/jobs/search` | `JobsSearchScreen` | list | loading, empty, error |
| `/jobs/filters` | `JobsFiltersScreen` | filter | normal |
| `/jobs/saved` | `SavedJobsScreen` | list | loading, empty, error |
| `/jobs/[jobId]` | `JobDetailsScreen` | detail | loading, error |
| `/jobs/post` | `PostJobScreen` | form | normal, error, success, loading |

## Component Inventory

- `JobsScreen` - multi-mode catalog/list screen driven by `screenId` prop
- `JobsSearchScreen` - search jobs list
- `JobsFiltersScreen` - apply job filters
- `SavedJobsScreen` - saved jobs list
- `JobDetailsScreen` - job detail with apply action
- `PostJobScreen` - create new job posting form
- Shared: `FeatureScreen`, `ScreenShell`, `SearchBar`, `FilterBar`, `ListScreen`, `Card`, `AppButton`, `DetailScreen`, `SectionHeader`, `MapPreview`, `FormScreen`, `Input`, `TextArea`, `Select`, `EmptyState`, `ErrorState`, `LoadingState`

## API Surface

- `getJobsScreen(screenId)` -> `GET /api/v1/jobs/screens/{screenId}`
- Job-specific endpoints in `frontend/src/modules/jobs/api.ts` for search, detail, and post actions.

## Demo Fixtures

- `frontend/src/modules/jobs/jobsFallbacks.ts` - demo fixtures for all jobs screens

## State Patterns

- **Loading**: `LoadingState` while jobs load
- **Empty**: `EmptyState` with action to search or post job
- **Error**: `ErrorState` with retry action
- **Success**: navigation on post completion
- **Offline**: offline banner with cached data
- **Permission**: not applicable

## Navigation Actions and Cross-Module Links

- Home actions: Search jobs, Filters, Saved jobs, Post job
- Search actions: Filters, Saved jobs, Post job
- Filters actions: Apply to search, Saved jobs
- Saved actions: Search jobs, Post job
- Details -> Post job, Saved
- Cross-module: deep link from explore and saved

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/jobs/` are thin wrappers
- `JobsScreen` uses `useQuery` with fallback data from `jobsFallbacks.ts`
- `FeatureScreen` provides adaptive catalog/list layout
- Job details screen uses inline API fetch with fallback
- Post job form is a placeholder pending full backend schema

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Focus ring: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Safe area insets always respected

## Current Implementation Status

- **Partial**: Home via `FeatureScreen`, search, filters, saved, and job details are UI-complete. Post job screen is a placeholder. Backend job posting, employer context, and moderation are pending.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.
