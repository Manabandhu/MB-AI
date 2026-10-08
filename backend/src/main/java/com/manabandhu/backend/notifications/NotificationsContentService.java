package com.manabandhu.backend.notifications;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private static final Map<String, Boolean> DEFAULT_SETTINGS = Map.of(
            "allNotifications", true,
            "inApp", true,
            "push", true,
            "email", true,
            "sms", false,
            "housingAlerts", true,
            "rideAlerts", true,
            "jobAlerts", true,
            "communityEvents", true,
            "safetyAlerts", true);

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    NotificationsContentService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    NotificationSettings settings(UUID userId) {
        return new NotificationSettings(Map.copyOf(load(userId)));
    }

    /** Merges known boolean toggles into the caller's own settings; unknown keys are ignored. */
    @Transactional
    NotificationSettings updateSettings(UUID userId, NotificationSettings update) {
        var merged = new TreeMap<>(load(userId));
        if (update != null && update.preferences() != null) {
            update.preferences().forEach((key, value) -> {
                if (DEFAULT_SETTINGS.containsKey(key) && value != null) merged.put(key, value);
            });
        }
        jdbcTemplate.update("""
                INSERT INTO public.notification_settings (user_id, preferences, updated_at)
                VALUES (?, ?::jsonb, NOW())
                ON CONFLICT (user_id) DO UPDATE SET preferences = EXCLUDED.preferences, updated_at = NOW()
                """, userId, toJson(merged));
        return new NotificationSettings(Map.copyOf(merged));
    }

    private Map<String, Boolean> load(UUID userId) {
        var merged = new TreeMap<>(DEFAULT_SETTINGS);
        var rows = jdbcTemplate.queryForList(
                "SELECT preferences::text FROM public.notification_settings WHERE user_id = ?", String.class, userId);
        if (!rows.isEmpty() && rows.get(0) != null) {
            try {
                Map<String, Boolean> stored = objectMapper.readValue(rows.get(0), new TypeReference<>() {});
                stored.forEach((key, value) -> {
                    if (DEFAULT_SETTINGS.containsKey(key) && value != null) merged.put(key, value);
                });
            } catch (JsonProcessingException ignored) {
                // A corrupt row falls back to defaults rather than failing the settings screen.
            }
        }
        return merged;
    }

    private String toJson(Map<String, Boolean> settings) {
        try {
            return objectMapper.writeValueAsString(settings);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize notification settings", exception);
        }
    }
}
