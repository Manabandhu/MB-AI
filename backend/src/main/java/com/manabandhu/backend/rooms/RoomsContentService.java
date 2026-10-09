package com.manabandhu.backend.rooms;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Rooms screens. Listing counts come from COUNT queries; saved and own-listing counts are computed for the
 * signed-in viewer only, so anonymous viewers never see a placeholder number.
 */
@Service
class RoomsContentService {

    private static final String PUBLISHED = "active";

    private final RoomListingRepository listingRepository;

    RoomsContentService(RoomListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    @Transactional(readOnly = true)
    CatalogScreenContent screen(String screenId, Optional<Actor> viewer) {
        return switch (screenId) {
            case "home" -> home(viewer);
            case "search" -> search(viewer);
            case "map" -> content("Map view", "Understand commute zones and nearby services without exposing exact private addresses.", "Rooms",
                    List.of(),
                    List.of(item("privacy", "Approximate locations", "Pins show general areas until a trusted contact exchange is approved.", "Privacy protected", "/rooms/search"),
                            item("commute", "Commute overlays", "Compare distance to work, school, groceries, and transit.", "Coming next", "/rooms/filters")));
            case "filters" -> content("Room filters", "Tune listings to match budget, location, household style, amenities, and safety preferences.", "Rooms",
                    List.of(),
                    List.of(item("availability", "Move-in window", "This week, this month, or custom dates.", "Availability", "/rooms/search"),
                            item("amenities", "Amenities", "Parking, private bath, furnished, laundry, kitchen, and pets.", "Comfort", "/rooms/search")));
            case "saved" -> saved(viewer);
            case "my-listings" -> myListings(viewer);
            case "create-listing" -> content("Create listing", "Post a room with clear expectations, privacy-aware location, and moderation-friendly details.", "Rooms",
                    List.of(),
                    List.of(item("basics", "Basics", "Rent, availability, room type, broad area, and preferred contact method.", "Step 1", "/rooms/my-listings"),
                            item("trust", "Trust and safety", "House rules, verification, reporting, and contact privacy settings.", "Step 2", "/rooms/my-listings")));
            case "details", "edit" -> content("Room details", "A focused listing page with price, availability, household fit, safety notes, and contact handoff.", "Rooms",
                    publishedAndSaved("Listings", viewer),
                    List.of(item("summary", "Browse listings", "Open a listing to see price, availability, and approximate location.", "Browse", "/rooms/search")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    private CatalogScreenContent home(Optional<Actor> viewer) {
        var items = latestPublished(6);
        var fallback = List.of(
                item("browse", "Browse rooms", "Search shared rooms and rentals with privacy-aware location.", "Start", "/rooms/search"),
                item("map", "View on map", "Discover listings by approximate area without exposing exact addresses.", "Map", "/rooms/map"));
        return content("Find a trusted place",
                "Browse shared rooms and rentals with privacy-aware location, host signals, and saved filters.",
                "Rooms",
                publishedAndSaved("Published listings", viewer),
                items.isEmpty() ? fallback : items);
    }

    private CatalogScreenContent search(Optional<Actor> viewer) {
        return content("Search rooms",
                "Search by city, budget, move-in date, household preference, commute, and trust signals.",
                "Rooms",
                publishedAndSaved("Published listings", viewer),
                latestPublished(12));
    }

    private CatalogScreenContent saved(Optional<Actor> viewer) {
        if (viewer.isEmpty()) {
            return content("Saved rooms", "Track listings you want to compare, revisit, or message about later.", "Rooms",
                    List.of(),
                    List.of(item("saved", "Sign in to see saved rooms", "Saved published listings appear here for easy comparison.", "Search rooms", "/rooms/search")));
        }
        return content("Saved rooms", "Track listings you want to compare, revisit, or message about later.", "Rooms",
                List.of(savedMetric(viewer.get())),
                List.of(item("search", "Find more rooms", "Save published listings to compare them here.", "Search rooms", "/rooms/search")));
    }

    private CatalogScreenContent myListings(Optional<Actor> viewer) {
        var metrics = viewer
                .map(actor -> List.of(new CatalogMetric("Your listings", String.valueOf(listingRepository.countByOwnerId(actor.id())))))
                .orElse(List.of());
        return content("My listings", "Manage your posted rooms, availability, moderation state, and applicant conversations.", "Rooms",
                metrics,
                List.of(item("create", "Create a listing", "Add photos, broad location, rent, amenities, and house rules.", "Create", "/rooms/create-listing")));
    }

    private List<CatalogMetric> publishedAndSaved(String publishedLabel, Optional<Actor> viewer) {
        var metrics = new ArrayList<CatalogMetric>();
        metrics.add(new CatalogMetric(publishedLabel, String.valueOf(listingRepository.countByStatus(PUBLISHED))));
        viewer.ifPresent(actor -> metrics.add(savedMetric(actor)));
        return List.copyOf(metrics);
    }

    private CatalogMetric savedMetric(Actor actor) {
        return new CatalogMetric("Saved", String.valueOf(listingRepository.countSavedListingsByUserId(actor.id())));
    }

    private List<CatalogItem> latestPublished(int limit) {
        return listingRepository.findByStatusOrderByCreatedAtDesc(PUBLISHED, PageRequest.of(0, limit)).stream()
                .map(l -> item(l.getId().toString(), l.getTitle(),
                        broadLocation(l) + " - " + l.getRoomType() + ".",
                        price(l), "/rooms/" + l.getId()))
                .toList();
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
