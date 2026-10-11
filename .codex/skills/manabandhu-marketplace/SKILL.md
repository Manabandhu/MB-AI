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
- Repo-Wide Code Review & Defect Remediation: Removed hardcoded fallback `CATEGORIES` array from `SellItemScreen.tsx` in favor of live backend category query; standardized `api.ts` to use `parseJsonOrThrow` consistently and removed redundant headers; added defensive route parameter guards on `ListingDetailsScreen.tsx`.
- Security & correctness hardening (2026-10): Removed the unreachable `MarketplaceGraphqlController` and the unrouted `MarketplaceSearchScreen`/`SavedItemsScreen` (they called `/marketplace/search` and `/marketplace/saved`, which never existed). Listing detail uses non-null-safe ids; screens use typed `Href` routes.
- Screen metrics are computed from the database (2026-10): `MarketplaceContentService.screen(id, Optional<Actor>)` counts active listings and categories, lists up to 12 real categories with active listing counts (`countByCategoryForStatus`), and shows the caller's own listing/saved counts only when signed in; invented filter/saved-search/form-step numbers were removed.
- Cleanup: removed the unused `index.ts` barrel and `CategoriesScreen.tsx`; `/marketplace/*` routes point at the screens that are actually used.
- Public API: `marketplace/index.ts` exports `moduleMeta` (launcher entry).
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
- Images (2026-10-11): `ListingImageService.add/delete(Actor, …)` enforces owner/admin in the service, and image URLs must be the owner's uploads in the `marketplace` bucket (400 otherwise). `SellItemScreen` should switch to `useImageUpload('marketplace')`; that is pending.
- Production pass (2026-10-11), backend:
  - **Listing views.** `ListingView` replaces the raw entity: no `ownerId`, plus `isMine`, `savedByViewer` and `coverImageUrl`, batch-loaded by `ListingViews`.
  - **Authorization in services.** `ListingService.update/delete(Actor, …)` and `ListingCategoryService.create(Actor, …)`; the controller no longer checks roles.
  - **Status.** Owner transitions are active↔reserved, active|reserved→sold, sold→active; `removed` and restoring are moderator-only. Active, reserved and sold listings are public; removed ones only for the owner and moderators.
  - **Validation.** Price required, ≥ 0, `@Digits(8,2)`; currency `[A-Z]{3}`; condition ∈ Brand New|Like New|Gently Used|Fair|Used; non-blank title on update; `""` clears optional text.
  - **Search and lists.** `GET /listings` searches server-side (`q`, `categoryId`, `condition`, `maxPrice`, `includeClosed`), newest first, size ≤ 100, client sort ignored. New `GET /listings/mine` and `GET /favorites/listings`. Categories and lists are capped at 200.
  - **Photos.** Max 10 per listing; deleting a listing or photo also deletes the stored file (`MediaService.deleteStoredQuietly`).
  - **Favorites.** Idempotent, and not allowed for your own listing or for non-active ones.
  - **Reports and contact.** `POST /listings/{id}/report` (`listing_reports`, one open report per member) and `POST /listings/{id}/contact` (opens or reuses a direct chat with the seller through `listing_conversations` and notifies the seller). V41 adds the status/price/currency checks and both tables, with RLS on and grants revoked.
  - **Tests.** `MarketplaceRulesTest`; smoke: `== marketplace production rules`.
- Production pass (2026-10-11), frontend:
  - **Routes.** New `/marketplace/mine` (`MyListingsScreen`: For sale / Sold / All tabs, quick status actions, edit, delete) and `/marketplace/[listingId]/edit` (`EditListingScreen`); both require sign-in and are listed in the screen catalog.
  - **Home.** Server-side debounced search with condition (all five values), price ceiling and "show reserved & sold" (`includeClosed`), 24 per page with "Load more" and the real `totalElements`. Covers come from `coverImageUrl`, prices keep their cents, and reserved/sold items get badges. "Sell an item", "My listings" and "Saved" entry points show on every size. The client-side sort and "negotiable only" filter are removed (the backend returns newest first).
  - **Detail.** 404 vs retry, a status badge, and a neutral seller card (no UUID avatar). "Chat with seller" calls `/contact` and opens the chat; there is a report sheet; owner actions follow the backend state machine (reserve, sold, relist, edit, delete; a moderator-removed listing can only be deleted). The share text is safe.
  - **Sell/Edit.** `ListingForm` uploads up to 10 photos with `useImageUpload('marketplace')`, attaches them after save, and keeps the created id so a retry never duplicates the listing. Price validation is strict, the description is capped at 4000 characters and nothing is appended to it, and the location field asks for an area only. "List another item" resets everything.
  - **Saving and errors.** `hooks/useListingSave` saves optimistically with rollback. `api.ts` throws on every failure; `listMarketplaceListings()` still returns an array for foundation's search.
  - **Accessibility.** Every control comes from shared primitives with roles and labels, and colors use tokens only. Chips stay 36 pt because of the shared `Chip`.
  - **"Make offer".** It was never implemented and is no longer claimed.
  - **Tests.** `frontend/test/marketplaceRules.test.mjs`.
  - **Shared primitives (2026-10-11).** `ListingBits.ListingStatusBadge` (was `StatusBadge`) maps listing statuses onto the shared `StatusBadge` tones; the home filters use the shared `FilterChipRow` (the local `ChipRow` is gone) and pressable chips are now 44 pt; `ListingDetailsScreen` uses the shared `ActionBar`; `utils/notify.ts` re-exports `shared/ui/notify`, and delete confirmations pass `{ destructive: true }`.
