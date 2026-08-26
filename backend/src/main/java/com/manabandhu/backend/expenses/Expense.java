package com.manabandhu.backend.expenses;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    private UUID id;

    @Column(name = "group_id", nullable = false, updatable = false)
    private UUID groupId;

    @Column(name = "payer_id", nullable = false)
    private UUID payerId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(length = 4000)
    private String description;

    @Column(length = 50)
    private String category;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Expense() {}

    Expense(UUID groupId, UUID payerId, BigDecimal amount, String currency, String description, String category, LocalDate expenseDate) {
        this.id = UUID.randomUUID();
        this.groupId = groupId;
        this.payerId = payerId;
        this.amount = amount;
        this.currency = currency;
        this.description = description;
        this.category = category;
        this.expenseDate = expenseDate;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getGroupId() { return groupId; }
    public UUID getPayerId() { return payerId; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public Instant getCreatedAt() { return createdAt; }
}
