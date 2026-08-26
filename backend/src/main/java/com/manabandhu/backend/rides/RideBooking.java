package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ride_bookings")
public class RideBooking {

    @Id
    private UUID id;

    @Column(name = "ride_id", nullable = false, updatable = false)
    private UUID rideId;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "seats_booked", nullable = false)
    private int seatsBooked;

    @Column(nullable = false, length = 20)
    String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RideBooking() {}

    RideBooking(UUID rideId, UUID userId, int seatsBooked, String status) {
        this.id = UUID.randomUUID();
        this.rideId = rideId;
        this.userId = userId;
        this.seatsBooked = seatsBooked;
        this.status = status;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getRideId() { return rideId; }
    public UUID getUserId() { return userId; }
    public int getSeatsBooked() { return seatsBooked; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }

    void setStatus(String status) { this.status = status; }
}
