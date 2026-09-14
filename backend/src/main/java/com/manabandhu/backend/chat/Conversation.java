package com.manabandhu.backend.chat;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "conversations")
public class Conversation {

    @Id
    private UUID id;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ConversationType type;

    @Column(length = 200)
    private String title;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    protected Conversation() {}

    Conversation(ConversationType type, String title) {
        this.id = UUID.randomUUID();
        this.type = type;
        this.title = title;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public ConversationType getType() { return type; }
    public String getTitle() { return title; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastMessageAt() { return lastMessageAt; }

    public void updateLastMessageAt(Instant at) {
        this.lastMessageAt = at;
    }

    public enum ConversationType {
        DIRECT, GROUP, ROOM_INQUIRY, RIDE_TEMP
    }
}
