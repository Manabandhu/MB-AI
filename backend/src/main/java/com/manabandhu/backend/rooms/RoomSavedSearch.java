package com.manabandhu.backend.rooms;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "room_saved_searches")
public class RoomSavedSearch {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 200)
    private String query;

    @Column(length = 200)
    private String city;

    @Column(name = "broad_location", length = 200)
    private String broadLocation;

    @Column(name = "room_type", length = 20)
    private String roomType;

    @Column(name = "min_price", precision = 10, scale = 2)
    private java.math.BigDecimal minPrice;

    @Column(name = "max_price", precision = 10, scale = 2)
    private java.math.BigDecimal maxPrice;

    @Column(name = "available_from")
    private java.time.LocalDate availableFrom;

    private Boolean furnished;

    @Column(name = "alerts_enabled", nullable = false)
    private boolean alertsEnabled;

    @Column(name = "last_notified_at")
    private Instant lastNotifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RoomSavedSearch() {}

    RoomSavedSearch(UUID userId, String name, String query, String city, String broadLocation,
                    String roomType, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice,
                    java.time.LocalDate availableFrom, Boolean furnished, boolean alertsEnabled) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.name = name;
        this.query = query;
        this.city = city;
        this.broadLocation = broadLocation;
        this.roomType = roomType;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.availableFrom = availableFrom;
        this.furnished = furnished;
        this.alertsEnabled = alertsEnabled;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getName() { return name; }
    public String getQuery() { return query; }
    public String getCity() { return city; }
    public String getBroadLocation() { return broadLocation; }
    public String getRoomType() { return roomType; }
    public java.math.BigDecimal getMinPrice() { return minPrice; }
    public java.math.BigDecimal getMaxPrice() { return maxPrice; }
    public java.time.LocalDate getAvailableFrom() { return availableFrom; }
    public Boolean getFurnished() { return furnished; }
    public boolean isAlertsEnabled() { return alertsEnabled; }
    public Instant getLastNotifiedAt() { return lastNotifiedAt; }
    public Instant getCreatedAt() { return createdAt; }

    public void setName(String name) { this.name = name; }
    public void setQuery(String query) { this.query = query; }
    public void setCity(String city) { this.city = city; }
    public void setBroadLocation(String broadLocation) { this.broadLocation = broadLocation; }
    public void setRoomType(String roomType) { this.roomType = roomType; }
    public void setMinPrice(java.math.BigDecimal minPrice) { this.minPrice = minPrice; }
    public void setMaxPrice(java.math.BigDecimal maxPrice) { this.maxPrice = maxPrice; }
    public void setAvailableFrom(java.time.LocalDate availableFrom) { this.availableFrom = availableFrom; }
    public void setFurnished(Boolean furnished) { this.furnished = furnished; }
    public void setAlertsEnabled(boolean alertsEnabled) { this.alertsEnabled = alertsEnabled; }
    public void setLastNotifiedAt(Instant lastNotifiedAt) { this.lastNotifiedAt = lastNotifiedAt; }
}
