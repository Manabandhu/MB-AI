package com.manabandhu.backend.notifications;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;
import java.util.regex.Pattern;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * The single store of notification settings ({@code notification_settings.preferences} jsonb). Channels
 * ({@code inApp}, {@code push}, {@code email}, {@code sms}), categories and quiet hours all live here; the
 * publisher and the push dispatcher read the same values the settings screen writes.
 */
@Service
public class NotificationsContentService {

    static final Map<String, Object> DEFAULT_SETTINGS = Map.ofEntries(
            Map.entry("allNotifications", true),
            Map.entry("inApp", true),
            Map.entry("push", true),
            Map.entry("email", true),
            Map.entry("sms", false),
            Map.entry("housingAlerts", true),
            Map.entry("rideAlerts", true),
            Map.entry("jobAlerts", true),
            Map.entry("referralAlerts", true),
            Map.entry("communityEvents", true),
            Map.entry("chatMessages", true),
            Map.entry("expenseAlerts", true),
            Map.entry("safetyAlerts", true),
            Map.entry("quietHours", false),
            Map.entry("quietStart", "22:00"),
            Map.entry("quietEnd", "07:00"),
            Map.entry("timeZone", "UTC"));

    private static final Set<String> TIME_KEYS = Set.of("quietStart", "quietEnd");
    private static final Pattern HH_MM = Pattern.compile("^([01]\\d|2[0-3]):[0-5]\\d$");

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    NotificationsContentService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public NotificationSettings settings(UUID userId) {
        return new NotificationSettings(Map.copyOf(load(userId)));
    }

    /**
     * Merges known keys into the caller's own settings. Unknown keys are ignored; a known key with the wrong
     * type or format (for example {@code quietStart: "25:00"}) is a 400 so the screen never shows "saved"
     * for a value that was dropped.
     */
    @Transactional
    public NotificationSettings updateSettings(UUID userId, NotificationSettings update) {
        var merged = new TreeMap<>(load(userId));
        if (update != null && update.preferences() != null) {
            update.preferences().forEach((key, value) -> {
                if (!DEFAULT_SETTINGS.containsKey(key) || value == null) return;
                merged.put(key, validated(key, value));
            });
        }
        jdbcTemplate.update("""
                INSERT INTO public.notification_settings (user_id, preferences, updated_at)
                VALUES (?, ?::jsonb, NOW())
                ON CONFLICT (user_id) DO UPDATE SET preferences = EXCLUDED.preferences, updated_at = NOW()
                """, userId, toJson(merged));
        return new NotificationSettings(Map.copyOf(merged));
    }

    /** True when the user wants in-app notifications of this category ({@code null} = no category toggle). */
    @Transactional(readOnly = true)
    public boolean allowsInApp(UUID userId, String categoryKey) {
        var settings = load(userId);
        return on(settings, "allNotifications") && on(settings, "inApp")
                && (categoryKey == null || on(settings, categoryKey));
    }

    @Transactional(readOnly = true)
    public boolean allowsPush(UUID userId) {
        var settings = load(userId);
        return on(settings, "allNotifications") && on(settings, "push");
    }

    /** When quiet hours are on and {@code now} falls inside them, the instant they end; otherwise {@code null}. */
    @Transactional(readOnly = true)
    public Instant quietUntil(UUID userId, Instant now) {
        return quietUntil(load(userId), now);
    }

    static Instant quietUntil(Map<String, Object> settings, Instant now) {
        if (!on(settings, "quietHours")) return null;
        ZoneId zone;
        try {
            zone = ZoneId.of(String.valueOf(settings.get("timeZone")));
        } catch (DateTimeException exception) {
            zone = ZoneId.of("UTC");
        }
        var start = LocalTime.parse(String.valueOf(settings.get("quietStart")));
        var end = LocalTime.parse(String.valueOf(settings.get("quietEnd")));
        if (start.equals(end)) return null;
        var local = ZonedDateTime.ofInstant(now, zone);
        var time = local.toLocalTime();
        var overnight = start.isAfter(end);
        var inside = overnight ? (!time.isBefore(start) || time.isBefore(end)) : (!time.isBefore(start) && time.isBefore(end));
        if (!inside) return null;
        var endDate = overnight && !time.isBefore(start) ? local.toLocalDate().plusDays(1) : local.toLocalDate();
        return endDate.atTime(end).atZone(zone).toInstant();
    }

    private static boolean on(Map<String, Object> settings, String key) {
        return Boolean.TRUE.equals(settings.get(key));
    }

    private static Object validated(String key, Object value) {
        if (TIME_KEYS.contains(key)) {
            if (value instanceof String text && HH_MM.matcher(text).matches()) return text;
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, key + " must be a 24-hour time like 22:00");
        }
        if (key.equals("timeZone")) {
            try {
                return ZoneId.of(String.valueOf(value)).getId();
            } catch (DateTimeException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "timeZone must be an IANA zone like America/Chicago");
            }
        }
        if (value instanceof Boolean flag) return flag;
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, key + " must be true or false");
    }

    private Map<String, Object> load(UUID userId) {
        var merged = new TreeMap<>(DEFAULT_SETTINGS);
        var rows = jdbcTemplate.queryForList(
                "SELECT preferences::text FROM public.notification_settings WHERE user_id = ?", String.class, userId);
        if (!rows.isEmpty() && rows.get(0) != null) {
            try {
                Map<String, Object> stored = objectMapper.readValue(rows.get(0), new TypeReference<>() {});
                stored.forEach((key, value) -> {
                    if (!DEFAULT_SETTINGS.containsKey(key) || value == null) return;
                    try {
                        merged.put(key, validated(key, value));
                    } catch (ResponseStatusException ignored) {
                        // A stale value keeps its default instead of failing the settings screen.
                    }
                });
            } catch (JsonProcessingException ignored) {
                // A corrupt row falls back to defaults rather than failing the settings screen.
            }
        }
        return merged;
    }

    private String toJson(Map<String, Object> settings) {
        try {
            return objectMapper.writeValueAsString(settings);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialise notification settings", exception);
        }
    }
}
