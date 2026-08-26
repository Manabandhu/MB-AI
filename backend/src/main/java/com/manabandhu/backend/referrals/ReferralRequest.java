package com.manabandhu.backend.referrals;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "referral_requests")
public class ReferralRequest {

    @Id
    private UUID id;

    @Column(name = "referral_id", nullable = false, updatable = false)
    private UUID referralId;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(length = 4000)
    private String details;

    @Column(nullable = false, length = 20)
    private String urgency;

    @Column(length = 4000)
    private String desiredOutcome;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ReferralRequest() {}

    ReferralRequest(UUID referralId, String category, String details, String urgency, String desiredOutcome) {
        this.id = UUID.randomUUID();
        this.referralId = referralId;
        this.category = category;
        this.details = details;
        this.urgency = urgency;
        this.desiredOutcome = desiredOutcome;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getReferralId() { return referralId; }
    public String getCategory() { return category; }
    public String getDetails() { return details; }
    public String getUrgency() { return urgency; }
    public String getDesiredOutcome() { return desiredOutcome; }
    public Instant getCreatedAt() { return createdAt; }
}
