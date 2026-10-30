package com.manabandhu.backend.chat;

import java.time.Instant;
import java.util.UUID;

/** The caller's read state for one conversation after {@code POST .../read}. */
public record ReadState(UUID conversationId, Instant lastReadAt, long unreadCount) {
}
