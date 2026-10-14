package com.manabandhu.backend.events;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "events")
public class Event {

    @Id
    private UUID id;

    @Column(name = "organizer_id", nullable = false, updatable = false)
    private UUID organizerId;

    /** Viewer flag set by {@link #viewedBy}; organizer ids are never serialized because event reads are public. */
    @jakarta.persistence.Transient
    private Boolean mine;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 4000)
    private String description;

    @Column(nullable = false, length = 200)
    private String location;

    @Column(precision = 10, scale = 6)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 6)
    private BigDecimal longitude;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at", nullable = false)
    private Instant endAt;

    @Column(name = "category_id", nullable = false, updatable = false)
    private UUID categoryId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Event() {}

    Event(UUID organizerId, String title, String description, String location, BigDecimal latitude, BigDecimal longitude,
          Instant startAt, Instant endAt, UUID categoryId, String status) {
        this.id = UUID.randomUUID();
        this.organizerId = organizerId;
        this.title = title;
        this.description = description;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.startAt = startAt;
        this.endAt = endAt;
        this.categoryId = categoryId;
        this.status = status;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    @com.fasterxml.jackson.annotation.JsonIgnore
    public UUID getOrganizerId() { return organizerId; }
    /** True when the viewer organizes the event, false otherwise; null when no viewer was applied. */
    public Boolean getMine() { return mine; }

    /** Sets {@link #getMine()} for the (optional) viewer and returns this event. */
    public Event viewedBy(com.manabandhu.backend.auth.Actor viewer) {
        this.mine = viewer != null && viewer.is(organizerId);
        return this;
    }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getLocation() { return location; }
    public BigDecimal getLatitude() { return latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public Instant getStartAt() { return startAt; }
    public Instant getEndAt() { return endAt; }
    public UUID getCategoryId() { return categoryId; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
