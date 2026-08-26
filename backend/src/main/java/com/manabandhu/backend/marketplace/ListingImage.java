package com.manabandhu.backend.marketplace;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "listing_images")
public class ListingImage {

    @Id
    private UUID id;

    @Column(name = "listing_id", nullable = false, updatable = false)
    private UUID listingId;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ListingImage() {}

    ListingImage(UUID listingId, String url, int sortOrder) {
        this.id = UUID.randomUUID();
        this.listingId = listingId;
        this.url = url;
        this.sortOrder = sortOrder;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getListingId() { return listingId; }
    public String getUrl() { return url; }
    public int getSortOrder() { return sortOrder; }
    public Instant getCreatedAt() { return createdAt; }
}
