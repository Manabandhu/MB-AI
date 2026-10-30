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

    /** Written only by {@link ConversationParticipantRepository#advanceLastReadAt} so it can never move backwards. */
    @Column(name = "last_read_at", insertable = false, updatable = false)
    private Instant lastReadAt;

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
    /** Package-private so the participant list never exposes other members' read times. */
    Instant getLastReadAt() { return lastReadAt; }

    public void leave() {
        this.leftAt = Instant.now();
    }

    void rejoin() {
        this.leftAt = null;
    }

    public enum ParticipantRole {
        OWNER, MEMBER
    }
}
