package com.manabandhu.backend.community;

import java.time.Instant;
import java.util.UUID;

/** A comment with its author's public display name; {@code mine} marks the viewer's own. No user ids. */
public record CommentView(UUID id, UUID postId, String authorName, boolean mine, String body, Instant createdAt) {

    static CommentView of(PostComment comment, String authorName, UUID viewerId) {
        return new CommentView(comment.getId(), comment.getPostId(), authorName,
                viewerId != null && viewerId.equals(comment.getAuthorId()), comment.getBody(), comment.getCreatedAt());
    }
}
