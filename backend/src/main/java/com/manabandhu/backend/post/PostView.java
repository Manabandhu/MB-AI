package com.manabandhu.backend.post;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * A community post as the app shows it: author display name (never a user id), comment count, reaction counts by
 * type, whether the viewer wrote it, and the viewer's own reaction ({@code null} when signed out or not reacted).
 */
public record PostView(
        UUID id,
        UUID communityId,
        String authorName,
        boolean mine,
        String title,
        String body,
        Instant createdAt,
        long commentCount,
        Map<String, Long> reactionCounts,
        long reactionCount,
        String viewerReaction) {}
