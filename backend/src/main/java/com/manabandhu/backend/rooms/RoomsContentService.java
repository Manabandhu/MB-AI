package com.manabandhu.backend.rooms;

import java.util.List;

import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.stereotype.Service;

@Service
class RoomsContentService {

    private final RoomListingService listingService;

    RoomsContentService(RoomListingService listingService) {
        this.listingService = listingService;
    }

    CatalogScreenContent screen(String screenId) {
        return switch (screenId) {
            case "home" -> home();
            case "search" -> search();
            case "map" -> content("Map view", "Understand commute zones and nearby services without exposing exact private addresses.", "Rooms",
                    List.of(new CatalogMetric("Visible areas", "6"), new CatalogMetric("Transit pins", "12")),
                    List.of(item("privacy", "Approximate locations", "Pins show general areas until a trusted contact exchange is approved.", "Privacy protected", "/rooms/search"),
                            item("commute", "Commute overlays", "Compare distance to work, school, groceries, and transit.", "Coming next", "/rooms/filters")));
            case "filters" -> content("Room filters", "Tune listings to match budget, location, household style, amenities, and safety preferences.", "Rooms",
                    List.of(new CatalogMetric("Active filters", "4"), new CatalogMetric("Matches", "11")),
                    List.of(item("availability", "Move-in window", "This week, this month, or custom dates.", "Availability", "/rooms/search"),
                            item("amenities", "Amenities", "Parking, private bath, furnished, laundry, kitchen, and pets.", "Comfort", "/rooms/search")));
            case "saved" -> saved();
            case "my-listings" -> myListings();
            case "create-listing" -> content("Create listing", "Post a room with clear expectations, privacy-aware location, and moderation-friendly details.", "Rooms",
                    List.of(new CatalogMetric("Steps", "5"), new CatalogMetric("Required fields", "8")),
                    List.of(item("basics", "Basics", "Rent, availability, room type, broad area, and preferred contact method.", "Step 1", "/rooms/my-listings"),
                            item("trust", "Trust and safety", "House rules, verification, reporting, and contact privacy settings.", "Step 2", "/rooms/my-listings")));
            case "details", "edit" -> content("Room details", "A focused listing page with price, availability, household fit, safety notes, and contact handoff.", "Rooms",
                    List.of(new CatalogMetric("Listings", String.valueOf(listingService.findAllPublished().size())), new CatalogMetric("Saved", "—")),
                    List.of(item("summary", "Browse listings", "Open a listing to see price, availability, and approximate location.", "Browse", "/rooms/search")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    private CatalogScreenContent home() {
        var published = listingService.findAllPublished();
        var items = published.stream().limit(6).map(l ->
                item(l.getId().toString(), l.getTitle(),
                        broadLocation(l) + " - " + l.getRoomType() + ".",
                        price(l), "/rooms/" + l.getId())).toList();
        var fallback = List.of(
                item("browse", "Browse rooms", "Search shared rooms and rentals with privacy-aware location.", "Start", "/rooms/search"),
                item("map", "View on map", "Discover listings by approximate area without exposing exact addresses.", "Map", "/rooms/map"));
        return content("Find a trusted place",
                "Browse shared rooms and rentals with privacy-aware location, host signals, and saved filters.",
                "Rooms",
                List.of(new CatalogMetric("Published listings", String.valueOf(published.size())),
                        new CatalogMetric("Saved", "—")),
                items.isEmpty() ? fallback : items);
    }

    private CatalogScreenContent search() {
        var published = listingService.findAllPublished();
        var items = published.stream().limit(12).map(l ->
                item(l.getId().toString(), l.getTitle(),
                        broadLocation(l) + " - " + l.getRoomType() + ".",
                        price(l), "/rooms/" + l.getId())).toList();
        return content("Search rooms",
                "Search by city, budget, move-in date, household preference, commute, and trust signals.",
                "Rooms",
                List.of(new CatalogMetric("Published listings", String.valueOf(published.size())),
                        new CatalogMetric("Saved", "—")),
                items);
    }

    private CatalogScreenContent saved() {
        return content("Saved rooms", "Track listings you want to compare, revisit, or message about later.", "Rooms",
                List.of(new CatalogMetric("Saved", "—")),
                List.of(item("saved", "Sign in to see saved rooms", "Saved published listings appear here for easy comparison.", "Search rooms", "/rooms/search")));
    }

    private CatalogScreenContent myListings() {
        return content("My listings", "Manage your posted rooms, availability, moderation state, and applicant conversations.", "Rooms",
                List.of(new CatalogMetric("Your listings", "—")),
                List.of(item("create", "Create your first listing", "Add photos, broad location, rent, amenities, and house rules.", "Create", "/rooms/create-listing")));
    }

    private static String broadLocation(RoomListing l) {
        return l.getBroadLocation() == null ? "Location pending" : l.getBroadLocation();
    }

    private static String price(RoomListing l) {
        return l.getPrice() == null ? "Contact for price" : ("$" + l.getPrice());
    }

    private static CatalogScreenContent content(String title, String subtitle, String eyebrow, List<CatalogMetric> metrics, List<CatalogItem> items) {
        return new CatalogScreenContent(title, subtitle, eyebrow, metrics, items);
    }

    private static CatalogItem item(String id, String title, String body, String meta, String route) {
        return new CatalogItem(id, title, body, meta, route, null);
    }
}
