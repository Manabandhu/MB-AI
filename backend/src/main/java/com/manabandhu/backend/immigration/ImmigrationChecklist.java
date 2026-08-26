package com.manabandhu.backend.immigration;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "immigration_checklists")
public class ImmigrationChecklist {

    @Id
    private UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false)
    private UUID ownerId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 4000)
    private String description;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(name = "items_json", nullable = false, length = 4000)
    private String itemsJson;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ImmigrationChecklist() {}

    ImmigrationChecklist(UUID ownerId, String title, String description, String category, String itemsJson, Instant dueDate) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.title = title;
        this.description = description;
        this.category = category;
        this.itemsJson = itemsJson;
        this.dueDate = dueDate;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public String getItemsJson() { return itemsJson; }
    public Instant getDueDate() { return dueDate; }
    public Instant getCompletedAt() { return completedAt; }
    public Instant getCreatedAt() { return createdAt; }

    public void markCompleted() {
        this.completedAt = Instant.now();
    }
}
