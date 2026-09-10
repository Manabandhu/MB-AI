---
name: manabandhu-backend-api
description: Maintain ManaBandhu's root Java 25 Spring Boot modular backend, including REST, GraphQL, security, persistence, migrations, health endpoints, automation control plane, and extraction-ready module boundaries. Use for any change under backend or backend-facing service logic.
---

# Backend API

1. Read the affected contract in `packages/api-contracts` before code.
2. Keep controllers thin; put authorization and business behavior in services/domain modules.
3. Validate Supabase JWTs and derive user identity from the verified subject. Never trust client-supplied owner IDs. Map an explicitly typed `List<String>` from `app_metadata.roles` to normalized `ROLE_*` authorities.
4. Use Flyway for schema evolution, bounded queries, explicit indexes, UTC timestamps, validation, and transactions.
5. Keep REST under `/api/v1`; keep GraphQL schema compatible with the canonical contract.
6. Privileged automation lives in the `admin` package: require the trusted `SUPER_ADMIN` role unless the temporary public admin override is enabled, map stable operation IDs to an allow-list, require reasons/confirmations, and keep provider credentials server-side.
7. Public foundation, notifications, rooms, and rides demo content endpoints (`/screens/{screenId}`) must remain read-only, contain no user data, stay under `/api/v1/foundation`, `/api/v1/notifications`, `/api/v1/rooms`, and `/api/v1/rides`, and include route fields only for client-owned in-app navigation targets. Rooms and rides also expose authenticated CRUD REST endpoints under `/api/v1/rooms` and `/api/v1/rides`; derive user identity from the verified JWT subject and never trust client-supplied owner IDs.
  8. Add tests for authorization, validation, failure behavior, and persistence boundaries.
9. Baseline existing Supabase schemas at Flyway version `0` so repository migrations still run from `V1`. New V2 (`room_listings`, `room_images`, `room_availabilities`, `room_bookings`, `room_favorites`) and V3 (`ride_offers`, `ride_requests`, `ride_participants`, `ride_bookings`, `ride_ratings`) migrations follow this baseline.
10. Use `pnpm dev:backend` for local backend startup; it loads `backend/.env` when present while preserving shell environment overrides, then runs the Maven wrapper.
11. Run Maven tests on Java 25.
12. Keep the backend parent on Spring Boot 4.1.0 with Java 25; use the managed `jackson-databind`, `spring-boot-starter-webmvc`, and `*-test` dependencies with that parent.
13. Module boundaries: immigration, safety, utilities, notifications, chat, ai, community, rooms, rides, jobs, events, expenses, marketplace, referrals, foundation, admin, auth, analytics, observability.
14. GraphQL controllers must expose all queries and mutations defined in the canonical schema; recent additions include `rideRatings` and `eventAttendance` queries mapped through `RidesGraphqlController` and `EventsGraphqlController`.
15. Update this skill when backend structure, dependencies, security, contracts, or commands change.
16. Admin reads for rides are exposed through `AdminRidesController` under the `admin` package and reuse the existing `AdminAccessPolicy`.

- Recent backend fixes: fixed duplicate Flyway V16 migration (renamed to V18/V19); added V17 migration adding `community_id` column to `community_posts`; created missing `NotificationSettings.java` record; added `reported` field to `RideOffer` entity and constructor; added inline `home()` catalog endpoint to `UtilitiesController`; expanded `SecurityConfig` public GET endpoints to include rooms listings/offers, rides offers, communities, posts, utilities, referrals, and safety center; added `communityId` to `CreatePostInput` and updated `CommunityPostService.create()`; added `@Valid` to AssistantController and ChatController endpoints; added `@NotNull` to CreateEventInput lat/lng; added ownership/participation checks to rides sub-resources, chat endpoints, and events attendance.

- Recent CI fixes: added missing `import com.manabandhu.backend.foundation.CatalogScreenContent;` to `ExpensesController`, `ImmigrationController`, `JobsController`, and `MarketplaceController` so the `@GetMapping("/screens/{screenId}")` endpoints resolve the return type; fixed `AssistantController` broken `PathVariable` import (`annotationPathVariable` -> `annotation/path/PathVariable`); added `isReported()` getter to `RideOffer` so `AdminRidesController` compiles; updated `CommunityPostServiceTest` to pass `communityId` to the new `CreatePostInput(UUID, String, String)` constructor; added `setReported(boolean)` mutator to `RideOffer` so admin moderation can flip the reported flag.
