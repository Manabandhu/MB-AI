---
name: manabandhu-observability
description: Maintain ManaBandhu observability across structured logs, OpenTelemetry traces, metrics, correlation IDs, dashboards, SLOs, alerts, synthetic checks, error reporting, audit signals, and runbooks.
---

# Observability

1. Current surface: `backend/.../health/HealthController`, Spring Boot Actuator (`health`, `info`, `metrics`; Prometheus is not exposed because no scraper is configured), and structured `log.info` audit lines. The `platform/observability` and `infra/observability` placeholders were removed on 2026-10-30.
2. Propagate trace and correlation IDs across REST, GraphQL, events, workers, notifications, chat, and AI calls.
3. Define SLIs/SLOs for user journeys, not only infrastructure.
4. Use structured events and bounded labels. Redact tokens, secrets, message bodies, prompts, and sensitive profile values at source.
5. Add dashboards, actionable alerts, ownership, and runbooks with new critical paths.
6. Test telemetry failure as non-fatal and verify redaction.
7. Automation events must carry operation, actor, environment, ref, and execution ID. Never log tokens, workflow secrets, or request authorization headers.
8. Update this skill when telemetry schemas, tooling, SLOs, alerts, or paths change.
