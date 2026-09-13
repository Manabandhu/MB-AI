# Marketplace

Owns marketplace discovery, categories, search, item listings, selling, saves, seller trust, messaging handoff, and moderation.

The first Stitch batch routes `/marketplace`, `/marketplace/search`, `/marketplace/categories`, `/marketplace/[listingId]`, `/marketplace/sell`, and `/marketplace/saved` share `screens/MarketplaceHomeScreen.tsx` and the read-only endpoint `GET /api/v1/marketplace/screens/{screenId}`.

Additional screens: `MarketplaceSearchScreen`, `CategoriesScreen`, `ListingDetailsScreen`, `SellItemScreen`, `SavedItemsScreen`.
