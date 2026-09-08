package com.manabandhu.backend.post;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "community_posts")
public class CommunityPost {

    @Id
    private UUID id;

    @Column(name = "community_id")
    private UUID communityId;

    @Column(name = "owner_id", nullable = false, updatable = false)
    private UUID ownerId;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 4000)
    private String body;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected CommunityPost() {}

    CommunityPost(UUID ownerId, String title, String body) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.title = title;
        this.body = body;
        this.createdAt = Instant.now();
    }

    CommunityPost(UUID communityId, UUID ownerId, String title, String body) {
        this.id = UUID.randomUUID();
        this.communityId = communityId;
        this.ownerId = ownerId;
        this.title = title;
        this.body = body;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getCommunityId() { return communityId; }
    public UUID getOwnerId() { return ownerId; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public Instant getCreatedAt() { return createdAt; }
}
