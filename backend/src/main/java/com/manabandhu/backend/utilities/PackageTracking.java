package com.manabandhu.backend.utilities;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "package_tracking")
public class PackageTracking {

    @Id
    private UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false)
    private UUID ownerId;

    @Column(name = "tracking_number", nullable = false, length = 80)
    private String trackingNumber;

    @Column(nullable = false, length = 80)
    private String carrier;

    @Column(nullable = false, length = 40)
    @Enumerated(EnumType.STRING)
    private TrackingStatus status;

    @Column(name = "estimated_delivery")
    private Instant estimatedDelivery;

    @Column(name = "last_update", nullable = false)
    private Instant lastUpdate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected PackageTracking() {}

    PackageTracking(UUID ownerId, String trackingNumber, String carrier, TrackingStatus status, Instant estimatedDelivery) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.trackingNumber = trackingNumber;
        this.carrier = carrier;
        this.status = status;
        this.estimatedDelivery = estimatedDelivery;
        this.lastUpdate = Instant.now();
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public String getTrackingNumber() { return trackingNumber; }
    public String getCarrier() { return carrier; }
    public TrackingStatus getStatus() { return status; }
    public Instant getEstimatedDelivery() { return estimatedDelivery; }
    public Instant getLastUpdate() { return lastUpdate; }
    public Instant getCreatedAt() { return createdAt; }

    public void updateStatus(TrackingStatus status) {
        this.status = status;
        this.lastUpdate = Instant.now();
    }

    public enum TrackingStatus {
        PENDING, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, EXCEPTION
    }
}
