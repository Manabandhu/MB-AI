package com.manabandhu.backend.safety;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "blocked_users")
public class BlockedUser {

    @Id
    private UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false)
    private UUID ownerId;

    @Column(name = "blocked_user_id", nullable = false)
    private UUID blockedUserId;

    @Column(length = 500)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected BlockedUser() {}

    BlockedUser(UUID ownerId, UUID blockedUserId, String reason) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.blockedUserId = blockedUserId;
        this.reason = reason;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public UUID getBlockedUserId() { return blockedUserId; }
    public String getReason() { return reason; }
    public Instant getCreatedAt() { return createdAt; }
}
