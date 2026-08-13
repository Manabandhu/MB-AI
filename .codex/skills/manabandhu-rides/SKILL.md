---
name: manabandhu-rides
description: Maintain ManaBandhu ride discovery, offers, requests, seats, participants, history, ratings, maps, safety, and ride management. Use for any change under the rides module or its contracts.
---

# Rides

1. Read `frontend/src/modules/rides/MODULE.md` and affected contracts first.
2. Model ride, seat-request, participant, and lifecycle states explicitly; make mutations idempotent.
3. First-batch ride routes `/rides`, `/rides/search`, `/rides/map`, `/rides/filters`, and `/rides/offer` share `frontend/src/modules/rides/screens/RidesScreen.tsx` and read public demo content from `GET /api/v1/rides/screens/{screenId}`.
4. Protect live and historical location data, enforce driver/rider permissions server-side, and integrate safety/reporting boundaries.
5. Test capacity races, cancellation, time zones, map/list behavior, notifications, ratings, and degraded connectivity.
6. Update contracts, module documentation, and this skill together.
