package com.manabandhu.backend.notifications;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreference {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(nullable = false, length = 40)
    @Enumerated(EnumType.STRING)
    private Channel channel;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected NotificationPreference() {}

    NotificationPreference(UUID userId, Channel channel, boolean enabled) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.channel = channel;
        this.enabled = enabled;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public Channel getChannel() { return channel; }
    public boolean isEnabled() { return enabled; }
    public Instant getCreatedAt() { return createdAt; }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public enum Channel {
        IN_APP, PUSH, EMAIL, SMS
    }
}
