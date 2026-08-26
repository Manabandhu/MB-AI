# Jobs

Owns job discovery, search, filters, saves, job details, posting, employer context, reporting, and moderation handoff.

The first Stitch batch routes `/jobs`, `/jobs/search`, `/jobs/filters`, `/jobs/saved`, `/jobs/[jobId]`, and `/jobs/post` share `screens/JobsHomeScreen.tsx`, `jobsFallbacks.ts`, and the read-only demo endpoint `GET /api/v1/jobs/screens/{screenId}`.

Additional screens: `JobsSearchScreen`, `JobsFiltersScreen`, `SavedJobsScreen`, `JobDetailsScreen`, `PostJobScreen`.
