# Super app foundation review — 2026-08-13

## Scope

Reviewed the root application boundaries, universal Expo client, Spring security and automation control plane, OpenAPI contract, GitHub workflows, module-skill governance, dependency automation, and build configuration.

## Results

- Root ownership is clear: `frontend/` contains every present/future client and `backend/` contains Spring Boot.
- The Super Admin client has no deployment credential or arbitrary-command path. Spring accepts allow-listed IDs and requires a signed `SUPER_ADMIN` app-metadata role.
- Risky operations require confirmation; all requests require a reason and carry actor/execution correlation into protected workflows.
- REST contracts, frontend types, backend records, workflow inputs, and the new Super Admin skill are synchronized.
- Pre-commit checks review staged module/skill coupling; CI reviews every commit in its comparison range and prints offending commit hashes.
- Dependabot covers pnpm, Maven, and GitHub Actions.

## Verification evidence

- Biome and TypeScript: pass.
- Contract verification: pass.
- All 12 module skills: coupling check and structural validation pass.
- Expo static web export: pass, including `/admin`.
- Git diff whitespace check: pass.
- Spring tests: blocked on this workstation because no Java runtime is installed; CI is configured for Temurin Java 25.
- Toolchain warning: local Node 20/pnpm 9 are below the repository's Node 22.13/pnpm 11.21 pins; CI uses the pinned versions.

## Historical governance findings

The new audit correctly identifies pre-existing drift in commits `d3aeb98ba980` (design-system skill) and `4285771cb436` (API-contracts, architecture, and deployments skills). Future pull requests audit only their base-to-head range, so they are not blocked by this inherited history. Rewriting published history is intentionally avoided.

## Deployment readiness boundary

The workflows are executable build/dispatch boundaries, but production delivery remains disabled until provider-specific commands/secrets and GitHub Environment reviewers are configured. AI evaluation dispatch also fails closed until its evaluation harness exists. This is intentional: the Super Admin page must not imply a provider is operational before credentials and approval policy are installed.
