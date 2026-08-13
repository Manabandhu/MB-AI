---
name: manabandhu-deployments
description: Maintain ManaBandhu build, CI/CD, environments, releases, migrations, native stores, web hosting, backend delivery, worker delivery, secret references, rollout, and rollback. Use for any deployment or release engineering change.
---

# Deployments

1. Read `platform/deployments/MODULE.md` and the affected `infra/deployments/*/MODULE.md`.
2. Keep native mobile, web, backend, migration, and worker pipelines independently releasable.
3. Pin tools and dependencies; use reproducible builds, previews, tests, contract checks, security scans, and provenance.
4. Reference secrets from the deployment platform. Never commit credentials or signing material.
5. Use staged/canary rollout, health and observability gates, backward-compatible migrations, and tested rollback.
6. Update this skill when providers, environments, pipeline paths, commands, or release policy change.

