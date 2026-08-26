package com.manabandhu.backend.immigration;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "faq_items")
public class FaqItem {

    @Id
    private UUID id;

    @Column(nullable = false, length = 500)
    private String question;

    @Column(nullable = false, length = 4000)
    private String answer;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(length = 400)
    private String tags;

    @Column(name = "is_published", nullable = false)
    private boolean published;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected FaqItem() {}

    FaqItem(String question, String answer, String category, String tags, boolean published, int sortOrder) {
        this.id = UUID.randomUUID();
        this.question = question;
        this.answer = answer;
        this.category = category;
        this.tags = tags;
        this.published = published;
        this.sortOrder = sortOrder;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getQuestion() { return question; }
    public String getAnswer() { return answer; }
    public String getCategory() { return category; }
    public String getTags() { return tags; }
    public boolean isPublished() { return published; }
    public int getSortOrder() { return sortOrder; }
    public Instant getCreatedAt() { return createdAt; }
}
