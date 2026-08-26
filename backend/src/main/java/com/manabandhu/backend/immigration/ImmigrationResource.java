package com.manabandhu.backend.immigration;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "immigration_resources")
public class ImmigrationResource {

    @Id
    private UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false)
    private UUID ownerId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 4000)
    private String description;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(length = 500)
    private String url;

    @Column(name = "resource_type", nullable = false, length = 40)
    @Enumerated(EnumType.STRING)
    private ResourceType resourceType;

    @Column(length = 400)
    private String tags;

    @Column(name = "is_verified", nullable = false)
    private boolean verified;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ImmigrationResource() {}

    ImmigrationResource(UUID ownerId, String title, String description, String category, String url, ResourceType resourceType, String tags, boolean verified) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.title = title;
        this.description = description;
        this.category = category;
        this.url = url;
        this.resourceType = resourceType;
        this.tags = tags;
        this.verified = verified;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public String getUrl() { return url; }
    public ResourceType getResourceType() { return resourceType; }
    public String getTags() { return tags; }
    public boolean isVerified() { return verified; }
    public Instant getCreatedAt() { return createdAt; }

    public enum ResourceType {
        DOCUMENT, GUIDE, LINK, FORM, TEMPLATE
    }
}
