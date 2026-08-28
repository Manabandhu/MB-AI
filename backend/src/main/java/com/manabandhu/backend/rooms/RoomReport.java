package com.manabandhu.backend.rooms;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "room_reports")
public class RoomReport {

    @Id
    private UUID id;

    @Column(name = "listing_id", nullable = false, updatable = false)
    private UUID listingId;

    @Column(name = "reporter_id", nullable = false, updatable = false)
    private UUID reporterId;

    @Column(nullable = false, length = 80)
    private String reason;

    @Column(length = 4000)
    private String description;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "reviewer_id")
    private UUID reviewerId;

    @Column(length = 4000)
    private String resolution;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    protected RoomReport() {}

    RoomReport(UUID listingId, UUID reporterId, String reason, String description) {
        this.id = UUID.randomUUID();
        this.listingId = listingId;
        this.reporterId = reporterId;
        this.reason = reason;
        this.description = description;
        this.status = "open";
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getListingId() { return listingId; }
    public UUID getReporterId() { return reporterId; }
    public String getReason() { return reason; }
    public String getDescription() { return description; }
    public String getStatus() { return status; }
    public UUID getReviewerId() { return reviewerId; }
    public String getResolution() { return resolution; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getReviewedAt() { return reviewedAt; }

    public void setStatus(String status) { this.status = status; }
    public void setReviewerId(UUID reviewerId) { this.reviewerId = reviewerId; }
    public void setResolution(String resolution) { this.resolution = resolution; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }
}
