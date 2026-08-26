package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ride_ratings")
public class RideRating {

    @Id
    private UUID id;

    @Column(name = "ride_id", nullable = false, updatable = false)
    private UUID rideId;

    @Column(name = "rater_id", nullable = false, updatable = false)
    private UUID raterId;

    @Column(name = "ratee_id", nullable = false, updatable = false)
    private UUID rateeId;

    @Column(nullable = false)
    private int rating;

    @Column(length = 4000)
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RideRating() {}

    RideRating(UUID rideId, UUID raterId, UUID rateeId, int rating, String comment) {
        this.id = UUID.randomUUID();
        this.rideId = rideId;
        this.raterId = raterId;
        this.rateeId = rateeId;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getRideId() { return rideId; }
    public UUID getRaterId() { return raterId; }
    public UUID getRateeId() { return rateeId; }
    public int getRating() { return rating; }
    public String getComment() { return comment; }
    public Instant getCreatedAt() { return createdAt; }
}
