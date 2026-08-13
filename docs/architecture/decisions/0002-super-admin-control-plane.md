# ADR 0002: Secure Super Admin automation control plane

- Status: accepted
- Date: 2026-08-13

## Decision

Provide one adaptive Expo Super Admin page for operational requests, backed by a Spring Boot control plane. Spring accepts only stable operation IDs from a fixed catalog and dispatches matching GitHub Actions workflows. Authorization comes from signed Supabase JWT `app_metadata.roles`, with `SUPER_ADMIN` required. Risky operations require explicit confirmation, a reason, an execution ID, and protected GitHub Environment approval.

The client cannot supply workflow paths, provider URLs, shell commands, tokens, or deployment credentials. Provider credentials live only in backend/runtime secret storage and GitHub Environments.

## Consequences

- Operators receive one cross-device surface without weakening infrastructure boundaries.
- Every execution can be correlated to an authenticated actor and CI run.
- Adding an operation requires coordinated catalog, contract, workflow, tests, and skill changes.
- Provider-specific deployment steps remain deliberately unconfigured until hosting targets and environment secrets are selected.
