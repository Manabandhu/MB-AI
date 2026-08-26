package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ride_requests")
public class RideRequest {

    @Id
    UUID id;

    @Column(name = "ride_id", nullable = false, updatable = false)
    UUID rideId;

    @Column(name = "rider_id", nullable = false, updatable = false)
    UUID riderId;

    @Column(name = "seats_requested", nullable = false)
    int seatsRequested;

    @Column(length = 4000)
    String message;

    @Column(nullable = false, length = 20)
    String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    protected RideRequest() {}

    RideRequest(UUID rideId, UUID riderId, int seatsRequested, String message, String status) {
        this.id = UUID.randomUUID();
        this.rideId = rideId;
        this.riderId = riderId;
        this.seatsRequested = seatsRequested;
        this.message = message;
        this.status = status;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getRideId() { return rideId; }
    public UUID getRiderId() { return riderId; }
    public int getSeatsRequested() { return seatsRequested; }
    public String getMessage() { return message; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }

    void setStatus(String status) { this.status = status; }
}
