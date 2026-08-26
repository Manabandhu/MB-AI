package com.manabandhu.backend.post;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "post_reactions")
public class PostReaction {

    @Id
    private UUID id;

    @Column(name = "post_id", nullable = false, updatable = false)
    private UUID postId;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(nullable = false, length = 20)
    String type;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected PostReaction() {}

    PostReaction(UUID postId, UUID userId, String type) {
        this.id = UUID.randomUUID();
        this.postId = postId;
        this.userId = userId;
        this.type = type;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getPostId() { return postId; }
    public UUID getUserId() { return userId; }
    public String getType() { return type; }
    public Instant getCreatedAt() { return createdAt; }
}
