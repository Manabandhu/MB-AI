package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.UUID;

public record RideChatResponse(
        UUID conversationId,
        UUID rideId,
        Instant chatExpiresAt,
        String message) {
    public RideChatResponse(UUID conversationId, Instant chatExpiresAt, String message) {
        this(conversationId, null, chatExpiresAt, message);
    }
}
