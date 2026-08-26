package com.manabandhu.backend.immigration;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "immigration_guides")
public class ImmigrationGuide {

    @Id
    private UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false)
    private UUID ownerId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 4000)
    private String description;

    @Column(nullable = false, length = 4000)
    private String content;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(name = "difficulty_level", nullable = false, length = 40)
    @Enumerated(EnumType.STRING)
    private DifficultyLevel difficultyLevel;

    @Column(name = "estimated_duration_minutes", nullable = false)
    private int estimatedDurationMinutes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ImmigrationGuide() {}

    ImmigrationGuide(UUID ownerId, String title, String description, String content, String category, DifficultyLevel difficultyLevel, int estimatedDurationMinutes) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.title = title;
        this.description = description;
        this.content = content;
        this.category = category;
        this.difficultyLevel = difficultyLevel;
        this.estimatedDurationMinutes = estimatedDurationMinutes;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getContent() { return content; }
    public String getCategory() { return category; }
    public DifficultyLevel getDifficultyLevel() { return difficultyLevel; }
    public int getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
    public Instant getCreatedAt() { return createdAt; }

    public enum DifficultyLevel {
        BEGINNER, INTERMEDIATE, ADVANCED
    }
}
