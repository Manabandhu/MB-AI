package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "settlements")
public class Settlement {

    @Id
    UUID id;

    @Column(name = "group_id", nullable = false, updatable = false)
    UUID groupId;

    @Column(name = "from_user_id", nullable = false)
    UUID fromUserId;

    @Column(name = "to_user_id", nullable = false)
    UUID toUserId;

    @Column(nullable = false, precision = 10, scale = 2)
    BigDecimal amount;

    @Column(nullable = false, length = 3)
    String currency;

    @Column(nullable = false, length = 20)
    String status;

    @Column(name = "settled_at")
    Instant settledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    protected Settlement() {}

    Settlement(UUID groupId, UUID fromUserId, UUID toUserId, BigDecimal amount, String currency, String status, Instant settledAt) {
        this.id = UUID.randomUUID();
        this.groupId = groupId;
        this.fromUserId = fromUserId;
        this.toUserId = toUserId;
        this.amount = amount;
        this.currency = currency;
        this.status = status;
        this.settledAt = settledAt;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getGroupId() { return groupId; }
    public UUID getFromUserId() { return fromUserId; }
    public UUID getToUserId() { return toUserId; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public String getStatus() { return status; }
    public Instant getSettledAt() { return settledAt; }
    public Instant getCreatedAt() { return createdAt; }
}
