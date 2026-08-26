package com.manabandhu.backend.rooms;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "room_availabilities")
public class RoomAvailability {

    @Id
    private UUID id;

    @Column(name = "listing_id", nullable = false, updatable = false)
    private UUID listingId;

    @Column(name = "available_from", nullable = false)
    private LocalDate availableFrom;

    @Column(name = "available_to", nullable = false)
    private LocalDate availableTo;

    @Column(name = "min_stay_months", nullable = false)
    private int minStayMonths;

    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.Instant createdAt;

    protected RoomAvailability() {}

    RoomAvailability(UUID listingId, LocalDate availableFrom, LocalDate availableTo, int minStayMonths) {
        this.id = UUID.randomUUID();
        this.listingId = listingId;
        this.availableFrom = availableFrom;
        this.availableTo = availableTo;
        this.minStayMonths = minStayMonths;
        this.createdAt = java.time.Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getListingId() { return listingId; }
    public LocalDate getAvailableFrom() { return availableFrom; }
    public LocalDate getAvailableTo() { return availableTo; }
    public int getMinStayMonths() { return minStayMonths; }
    public java.time.Instant getCreatedAt() { return createdAt; }
}
