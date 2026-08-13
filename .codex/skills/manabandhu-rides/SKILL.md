---
name: manabandhu-rides
description: Maintain ManaBandhu ride discovery, offers, requests, seats, participants, history, ratings, maps, safety, and ride management. Use for any change under the rides module or its contracts.
---

# Rides

1. Read `frontend/src/modules/rides/MODULE.md` and affected contracts first.
2. Model ride, seat-request, participant, and lifecycle states explicitly; make mutations idempotent.
3. Protect live and historical location data, enforce driver/rider permissions server-side, and integrate safety/reporting boundaries.
4. Test capacity races, cancellation, time zones, map/list behavior, notifications, ratings, and degraded connectivity.
5. Update contracts, module documentation, and this skill together.
