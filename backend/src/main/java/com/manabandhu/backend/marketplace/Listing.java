package com.manabandhu.backend.marketplace;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "listings")
public class Listing {

    @Id
    UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false)
    UUID ownerId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    ListingCategory category;

    @Column(nullable = false, length = 200)
    String title;

    @Column(length = 4000)
    String description;

    @Column(nullable = false, precision = 10, scale = 2)
    BigDecimal price;

    @Column(nullable = false, length = 3)
    String currency;

    @Column(length = 20)
    String condition;

    @Column(length = 200)
    String location;

    @Column(name = "is_negotiable")
    Boolean negotiable;

    @Column(nullable = false, length = 20)
    String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    protected Listing() {}

    Listing(UUID ownerId, ListingCategory category, String title, String description, BigDecimal price, String currency,
            String condition, String location, Boolean negotiable, String status) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.category = category;
        this.title = title;
        this.description = description;
        this.price = price;
        this.currency = currency;
        this.condition = condition;
        this.location = location;
        this.negotiable = negotiable;
        this.status = status;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public ListingCategory getCategory() { return category; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public BigDecimal getPrice() { return price; }
    public String getCurrency() { return currency; }
    public String getCondition() { return condition; }
    public String getLocation() { return location; }
    public Boolean getNegotiable() { return negotiable; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
