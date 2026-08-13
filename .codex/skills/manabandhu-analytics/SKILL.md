---
name: manabandhu-analytics
description: Maintain ManaBandhu product analytics, operational events, experimentation, privacy controls, consent, event schemas, pipelines, metrics, and dashboards. Use when adding measurement or changing tracked behavior.
---

# Analytics

Frontend consent and typed instrumentation belong to `frontend/src/modules/analytics`; pipeline ownership remains under `services/analytics-pipeline` and `platform/analytics`.

1. Read `platform/analytics/MODULE.md` and `services/analytics-pipeline/MODULE.md`.
2. Define the question, event owner, stable name/version, trigger, properties, consent basis, retention, and deletion behavior before instrumentation.
3. Validate events at ingestion and keep product analytics distinct from logs, traces, and audit records.
4. Never send tokens, secrets, raw chat bodies, unrestricted free text, or unnecessary personal data.
5. Make delivery non-blocking, batchable, retry-safe, and observable.
6. Test schema validation, consent off, offline buffering, duplicates, and deletion.
7. Update this skill and the event catalog when tracking behavior changes.
