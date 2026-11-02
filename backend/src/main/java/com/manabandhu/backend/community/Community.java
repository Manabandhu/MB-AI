package com.manabandhu.backend.community;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "communities")
public class Community {

    @Id
    private UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false)
    private UUID ownerId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 4000)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(length = 150, insertable = false, updatable = false)
    private String slug;

    @Column(length = 50, insertable = false, updatable = false)
    private String category;

    @Column(name = "metro_area", length = 100, insertable = false, updatable = false)
    private String metroArea;

    @Column(name = "member_count", insertable = false, updatable = false)
    private Integer memberCount;

    @Column(name = "avatar_url", insertable = false, updatable = false)
    private String avatarUrl;

    @Column(name = "cover_url", insertable = false, updatable = false)
    private String coverUrl;

    protected Community() {}

    Community(UUID ownerId, String name, String description) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.name = name;
        this.description = description;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Instant getCreatedAt() { return createdAt; }
    public String getSlug() { return slug; }
    public String getCategory() { return category; }
    public String getMetroArea() { return metroArea; }
    public int getMemberCount() { return memberCount == null ? 0 : memberCount; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getCoverUrl() { return coverUrl; }
}
