# Marketplace

Buy, sell and give away items with members nearby. All data comes from `/api/v1/marketplace` (`api.ts`); there is
no sample data, and every failed request shows an error with Retry.

## Routes

| Route | Screen | Notes |
| --- | --- | --- |
| `/marketplace` | `MarketplaceHomeScreen` (`screenId="home"`) | Server-side search, category, condition (Brand New, Like New, Gently Used, Fair, Used), price ceiling and "show reserved & sold"; 24 per page with "Load more"; real `totalElements`; pull-to-refresh |
| `/marketplace/search` | same, `screenId="search"` | Focuses the search field |
| `/marketplace/categories` | same, `screenId="categories"` | Opens the category picker sheet |
| `/marketplace/saved` | same, `screenId="saved"` (sign-in required) | `GET /favorites/listings` |
| `/marketplace/mine` | `MyListingsScreen` (sign-in required) | `GET /listings/mine`; For sale / Sold / All; status, edit, delete |
| `/marketplace/sell` | `SellItemScreen` → `ListingForm mode="create"` (sign-in required) | |
| `/marketplace/[listingId]` | `ListingDetailsScreen` | 404 vs retryable error; owner and buyer actions |
| `/marketplace/[listingId]/edit` | `EditListingScreen` → `ListingForm mode="edit"` (sign-in required) | Owner only |

"Sell an item", "My listings" and "Saved" buttons are shown on every window size.

## Behaviour

- **Listing cards** show `coverImageUrl` (or a neutral placeholder), the price with cents via `formatMoney` ("Free"
  for 0), condition, area, and a Reserved/Sold badge. The heart is hidden on your own listings.
- **Save** (`hooks/useListingSave.ts`): optimistic, keyed to the signed-in user, rolled back with an alert on
  failure, then the listing, list and saved queries are refetched. Signed-out viewers go to sign-in.
- **Detail**: photo gallery from `GET /listings/{id}/images` (cover image as fallback, with a retry if photos fail),
  status badge, details, description, a neutral "Seller" card (the seller id is never exposed), safety tips, share
  (no "null" in the text), Report sheet (`components/ReportListingSheet.tsx`; 409 means you already reported it).
  - Buyers: "Chat with seller" calls `POST /listings/{id}/contact` and opens `/chat/{conversationId}`.
  - Owners (`isMine`): Edit, Mark reserved, Mark sold, Make available, Relist, and Delete (confirmed first). Status
    transitions follow `ownerStatusActions` in `utils/listingRules.ts`, which mirrors the backend (invalid → 409;
    `removed` is moderator-only).
- **Sell/Edit** (`components/ListingForm.tsx`): up to 10 photos via `useImageUpload('marketplace')` with progress,
  per-photo errors and remove; photos are attached after the listing is saved, in order. If attaching fails the error
  is shown, the created id is kept (the retry updates instead of duplicating), and the success screen is not shown.
  Strict price validation (`parsePrice`: digits and up to two decimals, at most 99,999,999.99), "Give for free",
  categories with loading/error/Retry, description up to 4000 characters (nothing is appended to it), and an "Area"
  field that asks for a neighborhood or city only. In edit mode `''` clears description, area and condition.
  "List another item" resets the whole form.
- `utils/notify.ts` (`showError`, `confirmAction`) uses browser dialogs on web because `Alert.alert` does nothing
  there.

## Not supported

- Offers or price negotiation flows: buyers and sellers agree in chat. ("Negotiable" is only a flag on the listing.)
- Sorting other than newest first (the backend does not sort by price).
- Seller profiles or ratings.

## Tests

`frontend/test/marketplaceRules.test.mjs` covers price parsing, owner status transitions, query building, share text
and conditions.
