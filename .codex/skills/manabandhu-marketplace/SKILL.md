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

- Demo fixtures removed; screens use live backend queries, loading states, and error/empty states.

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

- Route files in `frontend/src/app/marketplace/` are thin wrappers. Unauthenticated guests can freely browse items and view details without forced sign-in redirects.
- `MarketplaceHomeScreen` integrates Stitch design `5d95554f3ad04b4c825641f92986fe4c`, rendering 2-column product card feeds with live Supabase `listings` data, search, category chips, condition filters, and responsive sort modal.
- `ListingDetailsScreen` integrates Stitch design `015eb6620ae544bc863d1ef4c7b044a3` with photo carousel, verified seller badges, specification grid, safe meetup tips, and make offer bottom sheet.
- Backend security allows public GET access to `/api/v1/marketplace` and `/api/v1/marketplace/**`.

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Focus ring: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Single column on compact, 2 columns on medium, 4 columns on expanded/wide desktop
- Safe area insets always respected
- Color is not the only indicator of state

## Current Implementation Status

- **Complete Discovery & Details**: Live Supabase data integration for marketplace listings and categories, responsive card grid with live prices, condition badges, seller verification tags, and make offer negotiation modal.
- **Fallback cleanup**: deleted `marketplaceFallbacks.ts` and removed inline fallbacks from `CategoriesScreen`, `MarketplaceSearchScreen`, and `SavedItemsScreen` in favor of live backend queries and responsive empty/error states.
- **Hardcoded data cleanup**: removed hardcoded seller persona ("Suresh Reddy") and static star rating from `ListingDetailsScreen` in favor of dynamic seller initial, member identifier, and verified resident badge.
- Foldable & compact screen responsiveness: added `isCompact` layout adaptations in `MarketplaceHomeScreen.tsx` for narrow fold cover screens (< 360px), ensuring single-column full-width product cards and avoiding banner button overlap in favor of the persistent mobile FAB.
- Sell item overhaul, unified design tokens & backend validation: Rebuilt `SellItemScreen.tsx` with category pills, condition selection cards, daylight safe meetup spot selector, photo slots, free giveaway ($0) toggle, and mutation wired to `POST /api/v1/marketplace/listings`; standardized `MarketplaceHomeScreen.tsx` and `ListingDetailsScreen.tsx` to unified design tokens (`#431ebe`, `#00696b`, `#ff7e33`); updated backend `CreateListingInput` validation to `@PositiveOrZero` to support free giveaways.
