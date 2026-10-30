# Jobs

Owns job discovery, search, filters, saves, job details, posting, employer context, reporting, and moderation handoff.

The first Stitch batch routes `/jobs`, `/jobs/search`, `/jobs/filters`, `/jobs/saved`, `/jobs/[jobId]`, and `/jobs/post` share `screens/JobsHomeScreen.tsx` and the read-only endpoint `GET /api/v1/jobs/screens/{screenId}`.

Additional screens: `JobsSearchScreen`, `JobsFiltersScreen`, `SavedJobsScreen`, `JobDetailsScreen`, `PostJobScreen`.
- Phase 1 (2026-10-14): see `.codex/skills/manabandhu-jobs/SKILL.md` for the current API surface, removed fake features, and known gaps.
