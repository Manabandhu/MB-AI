---
name: manabandhu-marketplace
description: Maintain ManaBandhu marketplace discovery, categories, search, item listings, selling, saves, seller trust, messaging handoff, and moderation. Use for any change under the marketplace module or its contracts.
---

# Marketplace

## Module Purpose and Ownership

Owns marketplace discovery, categories, search, item listings, selling, saves, seller trust, messaging handoff, and moderation.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/marketplace` | `MarketplaceScreen` (`screenId="home"`) | catalog | loading, empty, error |
| `/marketplace/search` | `MarketplaceSearchScreen` | list | loading, empty, error |
| `/marketplace/categories` | `CategoriesScreen` | list | loading, empty, error |
| `/marketplace/[listingId]` | `ListingDetailsScreen` | detail | loading, error |
| `/marketplace/sell` | `SellItemScreen` | form | normal, error, success, loading |
| `/marketplace/saved` | `SavedItemsScreen` | list | loading, empty, error |

## Component Inventory

- `MarketplaceScreen` - multi-mode catalog/list screen driven by `screenId` prop
- `MarketplaceSearchScreen` - search listings
- `CategoriesScreen` - browse categories
- `ListingDetailsScreen` - listing detail with image gallery and actions
- `SellItemScreen` - create new listing form
- `SavedItemsScreen` - saved listings list
- Shared: `FeatureScreen`, `ScreenShell`, `SearchBar`, `FilterBar`, `ListScreen`, `Card`, `AppButton`, `DetailScreen`, `SectionHeader`, `ImageGallery`, `FormScreen`, `Input`, `TextArea`, `ImageUpload`, `Select`, `EmptyState`, `ErrorState`, `LoadingState`

## API Surface

- `getMarketplaceScreen(screenId)` -> `GET /api/v1/marketplace/screens/{screenId}`
- Listing-specific endpoints in `frontend/src/modules/marketplace/api.ts` for detail and sell actions.

## Demo Fixtures

- `frontend/src/modules/marketplace/marketplaceFallbacks.ts` - demo fixtures for all marketplace screens

## State Patterns

- **Loading**: `LoadingState` while listings load
- **Empty**: `EmptyState` with action to search or sell
- **Error**: `ErrorState` with retry action
- **Success**: navigation on sell completion
- **Offline**: offline banner with cached data
- **Permission**: not applicable

## Navigation Actions and Cross-Module Links

- Home actions: Search, Categories, Sell item, Saved
- Search actions: Categories, Sell item, Saved
- Categories actions: Search, Sell item
- Saved actions: Search, Sell item
- Details -> Sell, Saved
- Cross-module: deep link from explore, saved, and chat handoff

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/marketplace/` are thin wrappers
- `MarketplaceScreen` uses `useQuery` with fallback data from `marketplaceFallbacks.ts`
- `FeatureScreen` provides adaptive catalog/list layout
- `ListingDetailsScreen` uses inline API fetch with fallback
- Sell item form is a placeholder pending full backend schema

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Focus ring: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Safe area insets always respected
- Color is not the only indicator of state

## Current Implementation Status

- **Partial**: Home via `FeatureScreen`, search, categories, saved, and listing details are UI-complete. Sell item screen is a placeholder. Backend listing availability, seller trust, and moderation are pending.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.

- Recent fixes: fixed `SellItemScreen` description field to use `react-hook-form` `control.register('description')` instead of local state (form could never validate); fixed `ListingDetailsScreen` "Message seller" to route to `/chat/new` instead of `/marketplace/saved`; refactored `ListingDetailsScreen` to use `useLocalSearchParams` and `apiClient` consistently.
