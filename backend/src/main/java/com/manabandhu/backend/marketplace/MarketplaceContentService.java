package com.manabandhu.backend.marketplace;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Marketplace screens. Listing and category counts come from COUNT queries; saved and own-listing counts are
 * computed for the signed-in viewer only.
 */
@Service
class MarketplaceContentService {

    private static final String ACTIVE = "active";

    private final ListingRepository listingRepository;
    private final ListingCategoryRepository categoryRepository;
    private final ListingFavoriteRepository favoriteRepository;

    MarketplaceContentService(ListingRepository listingRepository, ListingCategoryRepository categoryRepository,
                              ListingFavoriteRepository favoriteRepository) {
        this.listingRepository = listingRepository;
        this.categoryRepository = categoryRepository;
        this.favoriteRepository = favoriteRepository;
    }

    @Transactional(readOnly = true)
    CatalogScreenContent screen(String screenId, Optional<Actor> viewer) {
        return switch (screenId) {
            case "home" -> content(
                    "Buy and sell nearby",
                    "Discover local listings across categories with trust signals and safe handoff.",
                    "Marketplace",
                    List.of(
                            new CatalogMetric("Active listings", String.valueOf(listingRepository.countByStatus(ACTIVE))),
                            new CatalogMetric("Categories", String.valueOf(categoryRepository.count()))),
                    List.of(
                            item("browse", "Browse categories", "Find items by category, condition, and location.", "Open", "/marketplace/categories"),
                            item("search", "Search listings", "Search by title, keywords, and price range.", "Search", "/marketplace/search")));
            case "search" -> content(
                    "Search marketplace",
                    "Find items by title, category, price, condition, and location.",
                    "Marketplace",
                    List.of(new CatalogMetric("Active listings", String.valueOf(listingRepository.countByStatus(ACTIVE)))),
                    List.of(
                            item("title", "Title and keywords", "Search by item name, description, or keywords.", "Core filter", "/marketplace"),
                            item("price", "Price and condition", "Filter by price range, negotiation, and item condition.", "Filters", "/marketplace/categories")));
            case "categories" -> content(
                    "Browse by category",
                    "Explore listings grouped by category with trust and safety signals.",
                    "Marketplace",
                    List.of(
                            new CatalogMetric("Categories", String.valueOf(categoryRepository.count())),
                            new CatalogMetric("Listings", String.valueOf(listingRepository.countByStatus(ACTIVE)))),
                    categoryItems());
            case "sell" -> content(
                    "Sell an item",
                    "Create a listing with photos, price, condition, and safe contact handoff.",
                    "Marketplace",
                    viewer.map(actor -> List.of(
                                    new CatalogMetric("Your listings", String.valueOf(listingRepository.countByOwnerId(actor.id())))))
                            .orElse(List.of()),
                    List.of(
                            item("basics", "Basics", "Title, category, price, and condition.", "Step 1", "/marketplace"),
                            item("details", "Details", "Description, photos, location precision, and contact method.", "Step 2", "/marketplace/saved")));
            case "saved" -> viewer.map(actor -> content(
                            "Saved items",
                            "Track items you want to compare, revisit, or message about later.",
                            "Marketplace",
                            List.of(new CatalogMetric("Saved", String.valueOf(favoriteRepository.countByUserId(actor.id())))),
                            List.of(item("search", "Find more items", "Save listings to compare them here.", "Search marketplace", "/marketplace/search"))))
                    .orElseGet(() -> content(
                            "Saved items",
                            "Track items you want to compare, revisit, or message about later.",
                            "Marketplace",
                            List.of(),
                            List.of(item("saved", "Sign in to see saved items", "Saved listings appear here for easy comparison.", "Search marketplace", "/marketplace/search"))));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    /** Real categories (capped) with their active listing counts; generic browse link when none exist. */
    private List<CatalogItem> categoryItems() {
        var categories = categoryRepository.findTop12ByOrderByNameAsc();
        if (categories.isEmpty()) {
            return List.of(item("search", "Search listings", "Search by title, keywords, and price range.", "Search", "/marketplace/search"));
        }
        Map<UUID, Long> counts = new HashMap<>();
        for (var row : listingRepository.countByCategoryForStatus(ACTIVE)) {
            counts.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return categories.stream()
                .map(c -> {
                    long count = counts.getOrDefault(c.getId(), 0L);
                    return item(c.getSlug(), c.getName(), "Active listings in " + c.getName() + ".",
                            count + (count == 1 ? " listing" : " listings"), "/marketplace/search");
                })
                .toList();
    }

    private static CatalogScreenContent content(String title, String subtitle, String eyebrow,
                                                List<CatalogMetric> metrics, List<CatalogItem> items) {
        return new CatalogScreenContent(title, subtitle, eyebrow, metrics, items);
    }

    private static CatalogItem item(String id, String title, String body, String meta, String route) {
        return new CatalogItem(id, title, body, meta, route, null);
    }
}
