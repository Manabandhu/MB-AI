package com.manabandhu.backend.immigration;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "immigration_news")
public class ImmigrationNews {

    @Id
    private UUID id;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 4000)
    private String body;

    @Column(length = 200)
    private String source;

    @Column(length = 500)
    private String url;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ImmigrationNews() {}

    ImmigrationNews(String title, String body, String source, String url, String category, Instant publishedAt) {
        this.id = UUID.randomUUID();
        this.title = title;
        this.body = body;
        this.source = source;
        this.url = url;
        this.category = category;
        this.publishedAt = publishedAt;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public String getSource() { return source; }
    public String getUrl() { return url; }
    public String getCategory() { return category; }
    public Instant getPublishedAt() { return publishedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
