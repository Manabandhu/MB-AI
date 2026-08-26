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
@Table(name = "conversation_participants")
public class ConversationParticipant {

    @Id
    private UUID id;

    @Column(name = "conversation_id", nullable = false, updatable = false)
    private UUID conversationId;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ParticipantRole role;

    protected ConversationParticipant() {}

    ConversationParticipant(UUID conversationId, UUID userId, ParticipantRole role) {
        this.id = UUID.randomUUID();
        this.conversationId = conversationId;
        this.userId = userId;
        this.role = role;
        this.joinedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getConversationId() { return conversationId; }
    public UUID getUserId() { return userId; }
    public Instant getJoinedAt() { return joinedAt; }
    public Instant getLeftAt() { return leftAt; }
    public ParticipantRole getRole() { return role; }

    public void leave() {
        this.leftAt = Instant.now();
    }

    public enum ParticipantRole {
        OWNER, MEMBER
    }
}
