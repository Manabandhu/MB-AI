# Utilities

Owns package tracking, nearby services, emergency resources, provider links, location consent, freshness, and external-service boundaries.

## Component Inventory

- `UtilitiesHomeScreen` - catalog screen using `FeatureScreen`
- `PackageTrackingScreen` - list screen with `SearchBar`, timeline rows, and `SectionHeader`
- `NearbyScreen` - list screen with permission banner, map-style filter, and `SectionHeader`
- `EmergencyResourcesScreen` - list screen with warning banner and `SectionHeader`

## API

- `GET /api/v1/utilities/home` - returns `CatalogScreenContent`
- `GET /api/v1/utilities/packages` - returns `PackageItem[]`
- `GET /api/v1/utilities/nearby` - returns `NearbyItem[]`
- `GET /api/v1/utilities/emergency` - returns `EmergencyItem[]`

## Routes

- `/utilities` - `UtilitiesHomeScreen`
- `/utilities/packages` - `PackageTrackingScreen`
- `/utilities/nearby` - `NearbyScreen`
- `/utilities/emergency` - `EmergencyResourcesScreen`
