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

- `listJobPostings(page, size)` -> `GET /api/v1/jobs?page&size` (PagedModel via `toPage`)
- `getJobPosting(id)` -> `GET /api/v1/jobs/{id}`
- `listJobCategories()` -> `GET /api/v1/jobs/categories`
- `createJobPosting(input)` -> `POST /api/v1/jobs` (`categoryId` required by `@NotNull`)
- `updateJobPosting(id, input)` -> `PATCH /api/v1/jobs/{id}` (owner/admin; null fields unchanged; `status: open|closed`)
- `deleteJobPosting(id)` -> `DELETE /api/v1/jobs/{id}` (owner/admin; applications cascade)
- `applyToJob(id, {coverLetter, resumeUrl})` -> `POST /api/v1/jobs/{id}/applications` (409 for own/closed/duplicate)
- `listJobApplications(id)` -> `GET /api/v1/jobs/{id}/applications` (owner/admin; not used by a screen yet)
- Referral requests from a job use `createReferralRequest` in the referrals module and invalidate `['referrals']`.

## Demo Fixtures

- Frontend fallbacks removed in favor of backend API endpoints and loading/empty/error states.

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
- `JobsScreen` uses `useQuery` with backend API data
- `FeatureScreen` provides adaptive catalog/list layout
- Job details screen uses live API query with error and loading states
- Post job form is a placeholder pending full backend schema

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Focus ring: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Safe area insets always respected

- Recent implementation: Created Stitch MCP mobile and responsive designs (`6a09e96bf13b46e08ba1095d8dbb294d` for Discovery and `fb5972ed58e147c6bfe599525567de6f` for Job Details & Referral Application). Replaced placeholder with live PostgreSQL/Supabase tech jobs feed (`/api/v1/jobs`), responsive mobile bottom-sheet and desktop dialog modals for filtering and hub selection, verified corporate internal referrer spotlights, and interactive referral request workflow. Allowed public unauthenticated job discovery.
- Fallback cleanup: deleted `jobsFallbacks.ts` and removed inline fallbacks from `JobsSearchScreen` and `SavedJobsScreen` in favor of backend API endpoints and empty/error states.
- Hardcoded data cleanup: removed `getReferrerForJob` and `getCompanyDetails` containing hardcoded personas ("Sneha Murthy", "Vikram Patel", "Karthik Raman", "Ananya Rao", "Rajesh Verma") and static quotes from `JobsHomeScreen` and `JobDetailsScreen` in favor of dynamic community referral support.
- Repo-Wide Code Review & Defect Remediation: Fixed `PostJobScreen.tsx` dead mutation by adding `createJobPosting()` API call with TanStack `useMutation` and `queryClient.invalidateQueries({ queryKey: ['jobs'] })`; added defensive parameter guard and empty/error states in `JobDetailsScreen.tsx`; fixed React hook order violation (`useHookAtTopLevel`) in `JobsSearchScreen.tsx`.
- Global Location Store Sync: Integrated `JobsHomeScreen.tsx` with `useLocationStore` (`frontend/src/lib/locationStore.ts`), ensuring selected tech hub reactively reflects the global app location chosen on the Home screen.
- Security & correctness hardening (2026-10): Removed the unreachable `JobsGraphqlController` (no matching schema fields; it bypassed ownership checks). `listJobPostings` is typed instead of `any`; screens use typed `Href` routes.
- Screen metrics are computed from the database (2026-10): `JobsContentService.screen(id, Optional<Actor>)` counts open job postings and, for signed-in callers, their applications and postings; filters, saved and post-form numbers were removed.
- Cleanup: removed the unused `index.ts` barrel, `JobsSearchScreen.tsx`, `SavedJobsScreen.tsx`, and unused API/type exports.
- Salaries render with `formatSalaryRange` from `@manabandhu/core` (compact on the list, full amounts on the detail screen); an unlisted salary shows "Salary not listed" / "Not listed", never an invented label.
- Public API: `jobs/index.ts` exports `moduleMeta` and `JobsHomeWidget` (three newest postings).
- The Home widget query sets `meta: persistMeta` (public listings only) so it survives app restarts for 24 h.
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
- P0 fixes (2026-10-10): application rules live in `JobApplicationService`. Applying requires an `open` posting, is refused on your own posting, and allows one live application per person and job (409). `withdrawn` frees the slot; there is no DB unique index yet because hosted data may already hold duplicates. Status changes lock the row: the employer (posting owner) or an admin sets `reviewing|shortlisted|accepted|rejected`, the applicant may only `withdraw`, and accepted/rejected/withdrawn are final (409). Statuses are stored lowercase. Listing applicants (`GET /jobs/{id}/applications`) is owner/admin only, in the service.
- Paged responses (2026-10-12): `GET /api/v1/jobs` returns a `PagedModel` (`{ content, page }`); `listJobPostings` reads it through `toPage` from `@/lib/springPage`.
- Launcher keywords (2026-10-12): `module.ts` sets `keywords: ['work', 'career', 'hiring', 'openings', 'h1b', 'opt', 'remote', 'full-time']` (`ModuleMeta.keywords`), which Explore search matches by word prefix alongside the label, summary and category. Keep them to things this module does today.
- Phase 1 correctness pass (2026-10-14): `PostJobScreen` uses one `Controller` per field (spreading `register()` onto `TextField` never reached the form on native), a required category picker from `GET /jobs/categories`, company/location/remote/type/salary/URL matching `CreateJobPostingInput`, zod rules in `utils/jobForm.ts`, and doubles as the owner edit form at `/jobs/post?jobId=` (no new route). When no categories exist the form says posting is not open instead of failing. `JobsHomeScreen` was rebuilt on shared primitives: real filters only (`utils/jobFilters.ts`: keyword, location, category, remote, type, min salary, sort; closed jobs hidden), `/jobs/search` reads them from the URL that `/jobs/filters` writes. Removed: local-only saved jobs, the city picker that wrote Austin's coordinates into the global `locationStore`, keyword-guessing H-1B/OPT/visa/hybrid/referral tags, and the card "Request Referral" button. `/jobs/saved` is an honest "saving isn't available" screen (no backend). `JobDetailsScreen`: owners get Edit, Close/Reopen (confirm) and Delete (red confirm) instead of apply/referral; members apply in the app (`BottomSheet`, validated link), open the employer site, or post a referral request. Shared via `lib/share`.
- Known gap: job authorization still lives in `JobsController` (owner/admin checks), not `JobPostingService`; move it during the jobs backend review.
- Review fixes (2026-10-14): owner/admin checks for `PATCH`/`DELETE /jobs/{id}` moved into `JobPostingService.update(Actor, …)`/`delete(Actor, …)` (tests in `JobPostingServiceTest`). PATCH semantics: null/absent keeps, blank optional text (company, location, employmentType, applicationUrl) clears, blank title/description is 400, `clearSalary: true` empties both bounds before new ones apply, salaryMax below salaryMin is 400, status must be open|closed (stored lowercase). The edit form sends `toJobUpdate` (every field, `''` for cleared, `clearSalary: true`). `JobsHomeScreen` pages with `useInfiniteQuery` (`listJobPostingsPage`, 50 per page, "Load more"), shows the server's `totalElements`, and labels filtered results "n match among the latest x of total" (filters still run on loaded pages; no server-side filter params yet).
- Visual QA pass (2026-10-14, offline stack, 390/768/1440 light+dark): `employmentTypeLabel` (`types.ts`) shows enum-style values from API clients (`FULL_TIME`) as the form's words (`Full-time`) on `JobCard` and `JobDetailsScreen`; the owner Edit button uses the `pencil` icon; `JobsHomeScreen` always has a back button (falls back to `/home`) because the module home has no tab bar on phones.
