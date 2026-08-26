package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "expense_splits")
public class ExpenseSplit {

    @Id
    private UUID id;

    @Column(name = "expense_id", nullable = false, updatable = false)
    private UUID expenseId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal shareAmount;

    @Column(nullable = false)
    private boolean settled;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ExpenseSplit() {}

    ExpenseSplit(UUID expenseId, UUID userId, BigDecimal shareAmount, boolean settled) {
        this.id = UUID.randomUUID();
        this.expenseId = expenseId;
        this.userId = userId;
        this.shareAmount = shareAmount;
        this.settled = settled;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getExpenseId() { return expenseId; }
    public UUID getUserId() { return userId; }
    public BigDecimal getShareAmount() { return shareAmount; }
    public boolean isSettled() { return settled; }
    public Instant getCreatedAt() { return createdAt; }
}
