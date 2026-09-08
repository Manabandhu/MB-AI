package com.manabandhu.backend.notifications;

import java.util.List;
import java.util.Map;

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

    NotificationDetail detail(String id) {
        return switch (id) {
            case "room-match" -> new NotificationDetail(id, "New room match", "A room in Irving now matches your saved budget and move-in date.", "Rooms", false);
            case "ride-seat" -> new NotificationDetail(id, "Ride seat available", "A DFW airport ride has two open seats for Saturday morning.", "Rides", false);
            case "safety" -> new NotificationDetail(id, "Safety reminder", "Review trusted contacts before meeting a new host or driver.", "Safety", true);
            default -> new NotificationDetail(id, "Notification", "Notification details are not available.", "—", true);
        };
    }

    NotificationSettings settings() {
        return new NotificationSettings(Map.of(
                "inApp", true,
                "push", true,
                "email", false,
                "sms", false,
                "safetyAlerts", true));
    }
}