package com.manabandhu.backend.rooms;

import java.util.List;

import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.stereotype.Service;

@Service
class RoomsContentService {

    CatalogScreenContent screen(String screenId) {
        return switch (screenId) {
            case "home" -> content("Find a trusted place", "Browse shared rooms and rentals with privacy-aware location, host signals, and saved filters.", "Rooms",
                    List.of(new CatalogMetric("Nearby listings", "24"), new CatalogMetric("Verified hosts", "15")),
                    List.of(item("demo-room-1", "Sunny private room", "Irving - furnished - utilities included.", "$850/mo", "/rooms/demo-room-1"),
                            item("demo-room-2", "Shared apartment near transit", "Plano - flexible lease - vegetarian household.", "$720/mo", "/rooms/demo-room-2")));
            case "search" -> content("Search rooms", "Search by city, budget, move-in date, household preference, commute, and trust signals.", "Rooms",
                    List.of(new CatalogMetric("Filters", "9"), new CatalogMetric("Saved searches", "2")),
                    List.of(item("budget", "Budget range", "Set monthly rent, utilities, deposit, and lease flexibility.", "Core filter", null),
                            item("household", "Household match", "Find listings by lifestyle, language, food, and visitor preferences.", "Compatibility", null)));
            case "map" -> content("Map view", "Understand commute zones and nearby services without exposing exact private addresses.", "Rooms",
                    List.of(new CatalogMetric("Visible areas", "6"), new CatalogMetric("Transit pins", "12")),
                    List.of(item("privacy", "Approximate locations", "Pins show general areas until a trusted contact exchange is approved.", "Privacy protected", null),
                            item("commute", "Commute overlays", "Compare distance to work, school, groceries, and transit.", "Coming next", null)));
            case "filters" -> content("Room filters", "Tune listings to match budget, location, household style, amenities, and safety preferences.", "Rooms",
                    List.of(new CatalogMetric("Active filters", "4"), new CatalogMetric("Matches", "11")),
                    List.of(item("availability", "Move-in window", "This week, this month, or custom dates.", "Availability", null),
                            item("amenities", "Amenities", "Parking, private bath, furnished, laundry, kitchen, and pets.", "Comfort", null)));
            case "saved" -> content("Saved rooms", "Track listings you want to compare, revisit, or message about later.", "Rooms",
                    List.of(new CatalogMetric("Saved", "5"), new CatalogMetric("Price drops", "1")),
                    List.of(item("demo-room-1", "Sunny private room", "Move-in date still matches your onboarding preferences.", "Saved", "/rooms/demo-room-1")));
            case "my-listings" -> content("My listings", "Manage your posted rooms, availability, moderation state, and applicant conversations.", "Rooms",
                    List.of(new CatalogMetric("Active", "1"), new CatalogMetric("Drafts", "2")),
                    List.of(item("draft", "Complete your draft", "Add photos, broad location, rent, amenities, and house rules.", "Draft", null)));
            case "create-listing" -> content("Create listing", "Post a room with clear expectations, privacy-aware location, and moderation-friendly details.", "Rooms",
                    List.of(new CatalogMetric("Steps", "5"), new CatalogMetric("Required fields", "8")),
                    List.of(item("basics", "Basics", "Rent, availability, room type, broad area, and preferred contact method.", "Step 1", null),
                            item("trust", "Trust and safety", "House rules, verification, reporting, and contact privacy settings.", "Step 2", null)));
            case "details" -> content("Room details", "A focused listing page with price, availability, household fit, safety notes, and contact handoff.", "Rooms",
                    List.of(new CatalogMetric("Rent", "$850"), new CatalogMetric("Available", "Sep 1")),
                    List.of(item("summary", "Sunny private room in Irving", "Furnished room with utilities included and verified host signals.", "Broad location only", null),
                            item("next", "Request details", "Ask a question or request a safe contact exchange after review.", "Protected handoff", null)));
            case "edit" -> content("Edit listing", "Update a room listing while preserving moderation, ownership, and location privacy boundaries.", "Rooms",
                    List.of(new CatalogMetric("Sections", "6"), new CatalogMetric("Last saved", "Today")),
                    List.of(item("pricing", "Pricing and availability", "Keep rent, deposit, and move-in date current.", "Editable", null),
                            item("visibility", "Visibility", "Pause, publish, or send for moderation review.", "Owner only", null)));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    private static CatalogScreenContent content(String title, String subtitle, String eyebrow, List<CatalogMetric> metrics, List<CatalogItem> items) {
        return new CatalogScreenContent(title, subtitle, eyebrow, metrics, items);
    }

    private static CatalogItem item(String id, String title, String body, String meta, String route) {
        return new CatalogItem(id, title, body, meta, route, null);
    }
}
