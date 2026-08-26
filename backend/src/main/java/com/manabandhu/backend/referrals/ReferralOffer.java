package com.manabandhu.backend.referrals;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "referral_offers")
public class ReferralOffer {

    @Id
    private UUID id;

    @Column(name = "referral_id", nullable = false, updatable = false)
    private UUID referralId;

    @Column(nullable = false, length = 100)
    private String serviceType;

    @Column(length = 4000)
    private String availability;

    @Column(length = 4000)
    private String terms;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ReferralOffer() {}

    ReferralOffer(UUID referralId, String serviceType, String availability, String terms, Instant expiresAt) {
        this.id = UUID.randomUUID();
        this.referralId = referralId;
        this.serviceType = serviceType;
        this.availability = availability;
        this.terms = terms;
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getReferralId() { return referralId; }
    public String getServiceType() { return serviceType; }
    public String getAvailability() { return availability; }
    public String getTerms() { return terms; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getCreatedAt() { return createdAt; }
}
