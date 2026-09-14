package com.manabandhu.backend.rooms;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "room_listing_amenities")
public class RoomAmenity {

    @Id
    private UUID id;

    @Column(name = "listing_id", nullable = false, updatable = false)
    private UUID listingId;

    @Column(nullable = false, length = 80)
    private String amenity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RoomAmenity() {}

    RoomAmenity(UUID listingId, String amenity) {
        this.id = UUID.randomUUID();
        this.listingId = listingId;
        this.amenity = amenity;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getListingId() { return listingId; }
    public String getAmenity() { return amenity; }
    public Instant getCreatedAt() { return createdAt; }
}
