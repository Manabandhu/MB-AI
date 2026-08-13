package com.manabandhu.backend.rides;

import java.util.List;

import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.stereotype.Service;

@Service
class RidesContentService {

    CatalogScreenContent screen(String screenId) {
        return switch (screenId) {
            case "home" -> content(
                    "Go together safely",
                    "Find airport rides, local trips, commute matches, and community offers with clear seat and safety state.",
                    "Rides",
                    List.of(new CatalogMetric("Open rides", "18"), new CatalogMetric("Seats", "42")),
                    List.of(
                            item("airport", "DFW airport ride", "Saturday - 8:30 AM - two seats open.", "$18 contribution"),
                            item("grocery", "Grocery run", "Plano to Patel Brothers this evening.", "Local trip")));
            case "search" -> content(
                    "Search rides",
                    "Find rides by pickup area, destination, time window, seats, contribution, and driver trust signals.",
                    "Rides",
                    List.of(new CatalogMetric("Filters", "8"), new CatalogMetric("Saved searches", "3")),
                    List.of(
                            item("route", "Route and time", "Search by broad pickup area, destination, and flexible departure time.", "Core filter"),
                            item("seats", "Seats and luggage", "Match capacity, luggage, child seat, and contribution expectations.", "Trip fit")));
            case "map" -> content(
                    "Ride map",
                    "See pickup and drop-off areas with privacy-preserving location approximations.",
                    "Rides",
                    List.of(new CatalogMetric("Pickup zones", "5"), new CatalogMetric("Routes", "9")),
                    List.of(
                            item("zones", "Approximate pickup zones", "Exact pickup is shared only after a ride request is accepted.", "Privacy protected"),
                            item("routes", "Common routes", "Airport, campuses, grocery corridors, and commute paths.", "Discovery")));
            case "filters" -> content(
                    "Ride filters",
                    "Narrow ride discovery by schedule, seats, safety preference, contribution, and pickup flexibility.",
                    "Rides",
                    List.of(new CatalogMetric("Active filters", "3"), new CatalogMetric("Matches", "8")),
                    List.of(
                            item("time", "Departure window", "Morning, afternoon, evening, or custom trip windows.", "Timing"),
                            item("safety", "Safety preferences", "Verified drivers, known communities, ratings, and shared trip status.", "Safety")));
            case "offer" -> content(
                    "Offer a ride",
                    "Post a ride with route, time, seats, contribution, luggage, and safe contact expectations.",
                    "Rides",
                    List.of(new CatalogMetric("Steps", "4"), new CatalogMetric("Required fields", "7")),
                    List.of(
                            item("trip", "Trip basics", "Pickup area, destination, date, time, seats, and route flexibility.", "Step 1"),
                            item("safety", "Safety and visibility", "Set who can request, confirmation flow, and trip sharing options.", "Step 2")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    private static CatalogScreenContent content(String title, String subtitle, String eyebrow, List<CatalogMetric> metrics, List<CatalogItem> items) {
        return new CatalogScreenContent(title, subtitle, eyebrow, metrics, items);
    }

    private static CatalogItem item(String id, String title, String body, String meta) {
        return new CatalogItem(id, title, body, meta, null, null);
    }
}
