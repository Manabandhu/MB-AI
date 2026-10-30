---
name: manabandhu-analytics
description: Maintain ManaBandhu product analytics, operational events, experimentation, privacy controls, consent, event schemas, pipelines, metrics, and dashboards. Use when adding measurement or changing tracked behavior.
---

# Analytics

No analytics code exists yet (the empty `frontend/src/modules/analytics`, backend `analytics` package, and `platform/`/`services/` placeholders were removed on 2026-10-30). When instrumentation is added, put client code in `frontend/src/modules/analytics/` and server code in `backend/src/main/java/com/manabandhu/backend/analytics/`, and add both to `scripts/module-skill-rules.mjs`.

1. Define the question, event owner, stable name/version, trigger, properties, consent basis, retention, and deletion behavior before instrumentation.
2. Validate events at ingestion and keep product analytics distinct from logs, traces, and audit records.
3. Never send tokens, secrets, raw chat bodies, unrestricted free text, or unnecessary personal data.
4. Make delivery non-blocking, batchable, retry-safe, and observable.
5. Test schema validation, consent off, offline buffering, duplicates, and deletion.
6. Update this skill and the event catalog when tracking behavior changes.
