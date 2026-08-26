package com.manabandhu.backend.marketplace;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "listing_favorites")
public class ListingFavorite {

    @Id
    private UUID id;

    @Column(name = "listing_id", nullable = false, updatable = false)
    private UUID listingId;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ListingFavorite() {}

    ListingFavorite(UUID listingId, UUID userId) {
        this.id = UUID.randomUUID();
        this.listingId = listingId;
        this.userId = userId;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getListingId() { return listingId; }
    public UUID getUserId() { return userId; }
    public Instant getCreatedAt() { return createdAt; }
}
