package com.manabandhu.backend.rooms;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "room_bookings")
public class RoomBooking {

    @Id
    private UUID id;

    @Column(name = "listing_id", nullable = false, updatable = false)
    private UUID listingId;

    @Column(name = "requester_id", nullable = false, updatable = false)
    private UUID requesterId;

    @Column(nullable = false, length = 20)
    String status;

    @Column(length = 4000)
    String message;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RoomBooking() {}

    RoomBooking(UUID listingId, UUID requesterId, String status, String message) {
        this.id = UUID.randomUUID();
        this.listingId = listingId;
        this.requesterId = requesterId;
        this.status = status;
        this.message = message;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getListingId() { return listingId; }
    public UUID getRequesterId() { return requesterId; }
    public String getStatus() { return status; }
    public String getMessage() { return message; }
    public Instant getCreatedAt() { return createdAt; }

    void setStatus(String status) { this.status = status; }
}
