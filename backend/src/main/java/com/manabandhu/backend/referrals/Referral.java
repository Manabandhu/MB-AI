package com.manabandhu.backend.referrals;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "referrals")
public class Referral {

    @Id
    private UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false)
    private UUID ownerId;

    @Column(name = "recipient_id", nullable = false)
    private UUID recipientId;

    @Column(nullable = false, length = 10)
    String type;

    @Column(nullable = false, length = 20)
    String status;

    @Column(nullable = false, length = 200)
    String title;

    @Column(length = 4000)
    String description;

    @Column(length = 100)
    String category;

    @Column(name = "contact_info", length = 200)
    String contactInfo;

    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    protected Referral() {}

    Referral(UUID ownerId, UUID recipientId, String type, String title, String description, String status) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.recipientId = recipientId;
        this.type = type;
        this.title = title;
        this.description = description;
        this.status = status;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public UUID getRecipientId() { return recipientId; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getContactInfo() { return contactInfo; }
    public void setContactInfo(String contactInfo) { this.contactInfo = contactInfo; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
