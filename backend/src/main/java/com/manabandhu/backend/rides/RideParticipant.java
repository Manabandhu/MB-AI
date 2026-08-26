package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ride_participants")
public class RideParticipant {

    @Id
    private UUID id;

    @Column(name = "ride_id", nullable = false, updatable = false)
    private UUID rideId;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    protected RideParticipant() {}

    RideParticipant(UUID rideId, UUID userId, String role) {
        this.id = UUID.randomUUID();
        this.rideId = rideId;
        this.userId = userId;
        this.role = role;
        this.joinedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getRideId() { return rideId; }
    public UUID getUserId() { return userId; }
    public String getRole() { return role; }
    public Instant getJoinedAt() { return joinedAt; }
}
