---
name: manabandhu-deployments
description: Maintain ManaBandhu build, CI/CD, environments, releases, migrations, native stores, web hosting, backend delivery, worker delivery, secret references, rollout, and rollback. Use for any deployment or release engineering change.
---

# Deployments

1. Read `platform/deployments/MODULE.md` and the affected `infra/deployments/*/MODULE.md`.
2. Keep native mobile and web builds rooted at `frontend/`; keep backend, migration, and worker pipelines independently releasable.
3. Pin tools and dependencies; use reproducible builds, previews, tests, contract checks, security scans, and provenance.
4. Reference secrets from the deployment platform. Never commit credentials or signing material.
5. Use staged/canary rollout, health and observability gates, backward-compatible migrations, and tested rollback.
6. Super Admin dispatches only allow-listed `.github/workflows` through the Spring control plane. Preserve GitHub Environment approval gates and the `actor_id`/`execution_id` audit inputs.
7. Current workflows build web/backend/mobile artifacts, run migrations and AI evaluations, and expose provider command boundaries. Provider secrets and commands must be configured per GitHub Environment before production use.
8. Keep CI single-purpose and clearly named: Frontend, Backend, API Contracts, Governance, Dependency Review, Security Analysis, and Workflow Validation. Use path filters, least-privilege permissions, concurrency cancellation, timeouts, and short-lived artifacts where applicable.
9. Use Checkout 7, Setup Node 7, Setup Java 5, Setup Go 7, pnpm Setup 6, Upload Artifact 7, Dependency Review 5, CodeQL 4, and actionlint 1.7.9 until a deliberate verified upgrade.
10. Update this skill when providers, environments, pipeline paths, commands, action baselines, or release policy change.
