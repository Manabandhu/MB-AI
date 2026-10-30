# Utilities

Owns package tracking, nearby services, emergency resources, provider links, location consent, freshness, and external-service boundaries.

## Component Inventory

- `UtilitiesHomeScreen` - shortcuts plus searchable items from `/utilities/home`
- `PackageTrackingScreen` - your packages with status badges, search, and an "Add package" form
- `NearbyScreen` - directory places with real search and category filter; Directions and Call
- `EmergencyResourcesScreen` - Call 911, then resources with Call and Directions
- `utilitiesFormat.ts` - package statuses, search matching, distance, `tel:` and maps links

## API

- `GET /api/v1/utilities/home` - returns `CatalogScreenContent`
- `GET /api/v1/utilities/packages` - returns `PackageItem[]` (backend `PackageTracking`)
- `POST /api/v1/utilities/packages` - `{ trackingNumber, carrier, status, estimatedDelivery? }`
- `GET /api/v1/utilities/nearby` - returns `NearbyItem[]` (backend `NearbyPlace`)
- `GET /api/v1/utilities/emergency` - returns `EmergencyItem[]` (backend `EmergencyResource`)

## Routes (`/utilities/packages` requires sign-in; the rest are public)

- `/utilities` - `UtilitiesHomeScreen`
- `/utilities/packages` - `PackageTrackingScreen`
- `/utilities/nearby` - `NearbyScreen`
- `/utilities/emergency` - `EmergencyResourcesScreen`
