package com.manabandhu.backend.expenses;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "expense_groups")
public class ExpenseGroup {

    @Id
    UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false)
    UUID ownerId;

    @Column(nullable = false, length = 120)
    String name;

    @Column(length = 4000)
    String description;

    @Column(name = "group_type", length = 30)
    String groupType;

    @Column(length = 10)
    String currency;

    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    protected ExpenseGroup() {}

    ExpenseGroup(UUID ownerId, String name, String description, String groupType, String currency) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.name = name;
        this.description = description;
        this.groupType = groupType;
        this.currency = currency;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getGroupType() { return groupType; }
    public String getCurrency() { return currency; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
