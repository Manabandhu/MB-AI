package com.manabandhu.backend.rides;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;
import com.manabandhu.backend.foundation.UnknownCatalogScreenException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Rides screens. Counts and featured rides come from upcoming active offers; nothing is invented. */
@Service
class RidesContentService {

    private static final DateTimeFormatter DEPARTURE =
            DateTimeFormatter.ofPattern("EEE MMM d, HH:mm 'UTC'", Locale.US).withZone(ZoneOffset.UTC);

    private final RideOfferRepository offerRepository;
    private final Clock clock;

    @Autowired
    RidesContentService(RideOfferRepository offerRepository) {
        this(offerRepository, Clock.systemUTC());
    }

    RidesContentService(RideOfferRepository offerRepository, Clock clock) {
        this.offerRepository = offerRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    CatalogScreenContent screen(String screenId) {
        var now = Instant.now(clock);
        return switch (screenId) {
            case "home" -> content(
                    "Go together safely",
                    "Find airport rides, local trips, commute matches, and community offers with clear seat and safety state.",
                    "Rides",
                    List.of(
                            new CatalogMetric("Open rides", String.valueOf(offerRepository.countOpen(now))),
                            new CatalogMetric("Seats", String.valueOf(seats(offerRepository.sumOpenSeats(now))))),
                    upcoming(now));
            case "search" -> content(
                    "Search rides",
                    "Find rides by pickup area, destination, time window, seats, contribution, and driver trust signals.",
                    "Rides",
                    List.of(new CatalogMetric("Open rides", String.valueOf(offerRepository.countOpen(now)))),
                    List.of(
                            item("route", "Route and time", "Search by broad pickup area, destination, and flexible departure time.", "Core filter", "/rides/map"),
                            item("seats", "Seats and luggage", "Match capacity, luggage, child seat, and contribution expectations.", "Trip fit", "/rides/filters")));
            case "map" -> content(
                    "Ride map",
                    "See pickup and drop-off areas with privacy-preserving location approximations.",
                    "Rides",
                    List.of(
                            new CatalogMetric("Pickup areas", String.valueOf(offerRepository.countOpenPickupAreas(now))),
                            new CatalogMetric("Destinations", String.valueOf(offerRepository.countOpenDestinations(now)))),
                    List.of(
                            item("zones", "Approximate pickup zones", "Exact pickup is shared only after a ride request is accepted.", "Privacy protected", "/rides/search"),
                            item("routes", "Common routes", "Airport, campuses, grocery corridors, and commute paths.", "Discovery", "/rides/filters")));
            case "filters" -> content(
                    "Ride filters",
                    "Narrow ride discovery by schedule, seats, safety preference, contribution, and pickup flexibility.",
                    "Rides",
                    List.of(),
                    List.of(
                            item("time", "Departure window", "Morning, afternoon, evening, or custom trip windows.", "Timing", "/rides/search"),
                            item("safety", "Safety preferences", "Verified drivers, known communities, ratings, and shared trip status.", "Safety", "/rides/search")));
            case "offer" -> content(
                    "Offer a ride",
                    "Post a ride with route, time, seats, contribution, luggage, and safe contact expectations.",
                    "Rides",
                    List.of(),
                    List.of(
                            item("trip", "Trip basics", "Pickup area, destination, date, time, seats, and route flexibility.", "Step 1", "/rides"),
                            item("safety", "Safety and visibility", "Set who can request, confirmation flow, and trip sharing options.", "Step 2", "/rides/search")));
            default -> throw new UnknownCatalogScreenException(screenId);
        };
    }

    /** The next few open offers; generic navigation when there are none. */
    private List<CatalogItem> upcoming(Instant now) {
        var offers = offerRepository.searchActive(now, null, null, null, null, null, PageRequest.of(0, 3)).getContent();
        if (offers.isEmpty()) {
            return List.of(
                    item("search", "Find a ride", "Search open rides by pickup area, destination, and time.", "Search", "/rides/search"),
                    item("offer", "Offer a ride", "Post a ride with route, time, and seats.", "Offer", "/rides/offer"));
        }
        return offers.stream()
                .map(o -> item(o.getId().toString(),
                        o.getOriginArea() + " to " + o.getDestinationArea(),
                        DEPARTURE.format(o.getDepartureAt()) + " - " + o.getSeatsAvailable()
                                + (o.getSeatsAvailable() == 1 ? " seat open." : " seats open."),
                        o.getContribution(),
                        "/rides/" + o.getId()))
                .toList();
    }

    private static long seats(Long sum) {
        return sum != null ? sum : 0L;
    }

    private static CatalogScreenContent content(String title, String subtitle, String eyebrow, List<CatalogMetric> metrics, List<CatalogItem> items) {
        return new CatalogScreenContent(title, subtitle, eyebrow, metrics, items);
    }

    private static CatalogItem item(String id, String title, String body, String meta, String route) {
        return new CatalogItem(id, title, body, meta, route, null);
    }
}
