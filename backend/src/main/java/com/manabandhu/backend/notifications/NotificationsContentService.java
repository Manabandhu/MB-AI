package com.manabandhu.backend.notifications;

import java.util.List;

import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;

import org.springframework.stereotype.Service;

@Service
class NotificationsContentService {

    CatalogScreenContent inbox() {
        return new CatalogScreenContent(
                "Inbox",
                "Important updates from rooms, rides, communities, and account safety appear here.",
                "Notifications",
                List.of(new CatalogMetric("Unread", "3"), new CatalogMetric("Today", "7")),
                List.of(
                        new CatalogItem("room-match", "New room match", "A room in Irving now matches your saved budget and move-in date.", "Rooms", null, "unread"),
                        new CatalogItem("ride-seat", "Ride seat available", "A DFW airport ride has two open seats for Saturday morning.", "Rides", null, "unread"),
                        new CatalogItem("safety", "Safety reminder", "Review trusted contacts before meeting a new host or driver.", "Safety", null, "read")));
    }
}
