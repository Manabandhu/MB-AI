package com.manabandhu.backend.ai;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "assistant_citations")
public class AssistantCitation {

    @Id
    private UUID id;

    @Column(name = "message_id", nullable = false, updatable = false)
    private UUID messageId;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(length = 500)
    private String url;

    @Column(nullable = false, length = 4000)
    private String snippet;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AssistantCitation() {}

    AssistantCitation(UUID messageId, String title, String url, String snippet) {
        this.id = UUID.randomUUID();
        this.messageId = messageId;
        this.title = title;
        this.url = url;
        this.snippet = snippet;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getMessageId() { return messageId; }
    public String getTitle() { return title; }
    public String getUrl() { return url; }
    public String getSnippet() { return snippet; }
    public Instant getCreatedAt() { return createdAt; }
}
