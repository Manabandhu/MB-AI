package com.manabandhu.backend.rooms;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "room_analytics")
public class RoomAnalytic {

    @Id
    private UUID id;

    @Column(name = "listing_id", nullable = false, updatable = false)
    private UUID listingId;

    @Column(name = "event_type", nullable = false, length = 20)
    private String eventType;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RoomAnalytic() {}

    RoomAnalytic(UUID listingId, String eventType) {
        this.id = UUID.randomUUID();
        this.listingId = listingId;
        this.eventType = eventType;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getListingId() { return listingId; }
    public String getEventType() { return eventType; }
    public Instant getCreatedAt() { return createdAt; }
}
