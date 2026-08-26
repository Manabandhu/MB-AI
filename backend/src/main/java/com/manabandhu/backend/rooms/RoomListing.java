package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "room_listings")
public class RoomListing {

    @Id
    UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false)
    UUID ownerId;

    @Column(nullable = false, length = 200)
    String title;

    @Column(length = 4000)
    String description;

    @Column(nullable = false, precision = 10, scale = 2)
    BigDecimal price;

    @Column(nullable = false, length = 20)
    String roomType;

    @Column(nullable = false, length = 20)
    String status;

    @Column(length = 200)
    String broadLocation;

    @Column(name = "exact_address", length = 4000)
    String exactAddress;

    @Column(precision = 10, scale = 6)
    BigDecimal latitude;

    @Column(precision = 11, scale = 6)
    BigDecimal longitude;

    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    protected RoomListing() {}

    RoomListing(UUID ownerId, String title, String description, BigDecimal price, String roomType, String status,
                String broadLocation, String exactAddress, BigDecimal latitude, BigDecimal longitude) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.title = title;
        this.description = description;
        this.price = price;
        this.roomType = roomType;
        this.status = status;
        this.broadLocation = broadLocation;
        this.exactAddress = exactAddress;
        this.latitude = latitude;
        this.longitude = longitude;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public BigDecimal getPrice() { return price; }
    public String getRoomType() { return roomType; }
    public String getStatus() { return status; }
    public String getBroadLocation() { return broadLocation; }
    public String getExactAddress() { return exactAddress; }
    public BigDecimal getLatitude() { return latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    void setTitle(String title) { this.title = title; }
    void setDescription(String description) { this.description = description; }
    void setPrice(BigDecimal price) { this.price = price; }
    void setStatus(String status) { this.status = status; }
    void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
