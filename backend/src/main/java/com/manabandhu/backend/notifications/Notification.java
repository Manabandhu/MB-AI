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
@Table(name = "notifications")
public class Notification {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 4000)
    private String body;

    @Column(nullable = false, length = 40)
    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Column(nullable = false)
    private boolean read;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "action_route", length = 200)
    private String actionRoute;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "dispatched", nullable = false)
    private boolean dispatched;

    @Column(name = "dispatched_at")
    private Instant dispatchedAt;

    protected Notification() {}

    Notification(UUID userId, String title, String body, NotificationType type, String actionRoute) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.title = title;
        this.body = body;
        this.type = type;
        this.read = false;
        this.actionRoute = actionRoute;
        this.createdAt = Instant.now();
        this.dispatched = false;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public NotificationType getType() { return type; }
    public boolean isRead() { return read; }
    public Instant getReadAt() { return readAt; }
    public String getActionRoute() { return actionRoute; }
    public Instant getCreatedAt() { return createdAt; }
    public boolean isDispatched() { return dispatched; }
    public Instant getDispatchedAt() { return dispatchedAt; }

    public void markRead() {
        this.read = true;
        this.readAt = Instant.now();
    }

    public void markDispatched() {
        this.dispatched = true;
        this.dispatchedAt = Instant.now();
    }

    public enum NotificationType {
        SYSTEM, COMMUNITY, SAFETY, RIDE, ROOM, CHAT, AI
    }
}
