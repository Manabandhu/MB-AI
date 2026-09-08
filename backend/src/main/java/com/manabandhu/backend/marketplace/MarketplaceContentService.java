package com.manabandhu.backend.marketplace;

import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.stereotype.Service;

@Service
class MarketplaceContentService {

    CatalogScreenContent screen(String screenId) {
        return switch (screenId) {
            case "home" -> content(
                    "Buy and sell nearby",
                    "Discover local listings across categories with trust signals and safe handoff.",
                    "Marketplace",
                    java.util.List.of(
                            new CatalogMetric("Active listings", "56"),
                            new CatalogMetric("Categories", "9")),
                    java.util.List.of(
                            item("browse", "Browse categories", "Find items by category, condition, and location.", "Open", "/marketplace/categories"),
                            item("search", "Search listings", "Search by title, keywords, and price range.", "Search", "/marketplace/search")));
            case "search" -> content(
                    "Search marketplace",
                    "Find items by title, category, price, condition, and location.",
                    "Marketplace",
                    java.util.List.of(
                            new CatalogMetric("Filters", "7"),
                            new CatalogMetric("Saved searches", "3")),
                    java.util.List.of(
                            item("title", "Title and keywords", "Search by item name, description, or keywords.", "Core filter", "/marketplace"),
                            item("price", "Price and condition", "Filter by price range, negotiation, and item condition.", "Filters", "/marketplace/categories")));
            case "categories" -> content(
                    "Browse by category",
                    "Explore listings grouped by category with trust and safety signals.",
                    "Marketplace",
                    java.util.List.of(
                            new CatalogMetric("Categories", "9"),
                            new CatalogMetric("Listings", "56")),
                    java.util.List.of(
                            item("electronics", "Electronics", "Phones, laptops, and accessories.", "Trending", "/marketplace/search"),
                            item("furniture", "Furniture", "Home goods, decor, and appliances.", "Popular", "/marketplace/search")));
            case "sell" -> content(
                    "Sell an item",
                    "Create a listing with photos, price, condition, and safe contact handoff.",
                    "Marketplace",
                    java.util.List.of(
                            new CatalogMetric("Steps", "4"),
                            new CatalogMetric("Required fields", "6")),
                    java.util.List.of(
                            item("basics", "Basics", "Title, category, price, and condition.", "Step 1", "/marketplace"),
                            item("details", "Details", "Description, photos, location precision, and contact method.", "Step 2", "/marketplace/saved")));
            case "saved" -> content(
                    "Saved items",
                    "Track items you want to compare, revisit, or message about later.",
                    "Marketplace",
                    java.util.List.of(
                            new CatalogMetric("Saved", "—")),
                    java.util.List.of(item("saved", "Sign in to see saved items", "Saved listings appear here for easy comparison.", "Search marketplace", "/marketplace/search")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    private static CatalogScreenContent content(String title, String subtitle, String eyebrow,
                                                 java.util.List<CatalogMetric> metrics,
                                                 java.util.List<CatalogItem> items) {
        return new CatalogScreenContent(title, subtitle, eyebrow, metrics, items);
    }

    private static CatalogItem item(String id, String title, String body, String meta, String route) {
        return new CatalogItem(id, title, body, meta, route, null);
    }
}