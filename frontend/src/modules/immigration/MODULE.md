# Immigration

Owns curated resources, guides, checklists, FAQ, community Q&A, USCIS links, news, saves, citations, freshness, and legal-information disclaimers.

The first Stitch batch routes `/immigration`, `/immigration/resources`, `/immigration/guides`, `/immigration/checklists`, `/immigration/faq`, `/immigration/questions`, `/immigration/uscis`, `/immigration/news`, `/immigration/saved`, and `/immigration/resources/[resourceId]` share `screens/ImmigrationHomeScreen.tsx` and the read-only endpoint `GET /api/v1/immigration/screens/{screenId}`.

Additional screens: `ResourcesScreen`, `GuidesScreen`, `ChecklistsScreen`, `FaqScreen`, `ImmigrationNewsScreen`, `ResourceDetailScreen` (backed by `GET /api/v1/immigration/resources/{id}`). Unrouted questions, USCIS and saved-resources screens that called nonexistent endpoints were removed.
- Phase 1 (2026-10-14): see `.codex/skills/manabandhu-immigration/SKILL.md` for the current API surface, removed fake features, and known gaps.
