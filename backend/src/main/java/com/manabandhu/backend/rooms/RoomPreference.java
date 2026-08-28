package com.manabandhu.backend.rooms;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "room_preferences")
public class RoomPreference {

    @Id
    private UUID id;

    @Column(name = "listing_id", nullable = false, updatable = false)
    private UUID listingId;

    @Column(nullable = false, length = 80)
    private String preference;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RoomPreference() {}

    RoomPreference(UUID listingId, String preference) {
        this.id = UUID.randomUUID();
        this.listingId = listingId;
        this.preference = preference;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getListingId() { return listingId; }
    public String getPreference() { return preference; }
    public Instant getCreatedAt() { return createdAt; }
}
