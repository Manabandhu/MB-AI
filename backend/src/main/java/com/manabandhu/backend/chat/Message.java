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
@Table(name = "messages")
public class Message {

    @Id
    private UUID id;

    @Column(name = "conversation_id", nullable = false, updatable = false)
    private UUID conversationId;

    @Column(name = "sender_id", nullable = false, updatable = false)
    private UUID senderId;

    @Column(nullable = false, length = 4000)
    private String body;

    @Column(name = "message_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private MessageType messageType;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Message() {}

    Message(UUID conversationId, UUID senderId, String body, MessageType messageType) {
        this.id = UUID.randomUUID();
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.body = body;
        this.messageType = messageType;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getConversationId() { return conversationId; }
    public UUID getSenderId() { return senderId; }
    public String getBody() { return body; }
    public MessageType getMessageType() { return messageType; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void updateBody(String body) {
        this.body = body;
        this.updatedAt = Instant.now();
    }

    public enum MessageType {
        TEXT, IMAGE, SYSTEM
    }
}
