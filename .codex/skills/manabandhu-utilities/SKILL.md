---
name: manabandhu-utilities
description: Maintain ManaBandhu package tracking, nearby services, emergency resources, provider links, location consent, freshness, and external integrations. Use for any change under the utilities module.
---

# Utilities

1. Read `frontend/src/modules/utilities/MODULE.md` and affected provider contracts first.
2. Put providers behind typed adapters with timeouts, retries, rate limits, caching, and clear degraded states.
3. Request location only when needed, minimize retention, and label external links, source, and freshness.
4. Never imply guaranteed emergency availability; provide direct official contact paths and offline fallbacks.
5. Test provider failure, stale data, permission denial, accessibility, and adaptive layouts.
