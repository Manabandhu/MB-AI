package com.manabandhu.backend.notifications;

import java.util.Map;

/**
 * The caller's notification settings: boolean toggles (channels and categories) plus quiet hours
 * ({@code quietHours}, {@code quietStart}/{@code quietEnd} as "HH:mm", {@code timeZone} as an IANA zone).
 */
public record NotificationSettings(Map<String, Object> preferences) {}
