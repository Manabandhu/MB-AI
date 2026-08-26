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
@Table(name = "device_registrations")
public class DeviceRegistration {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "device_token", nullable = false, length = 200)
    private String deviceToken;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Platform platform;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected DeviceRegistration() {}

    DeviceRegistration(UUID userId, String deviceToken, Platform platform, boolean enabled) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.deviceToken = deviceToken;
        this.platform = platform;
        this.enabled = enabled;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getDeviceToken() { return deviceToken; }
    public Platform getPlatform() { return platform; }
    public boolean isEnabled() { return enabled; }
    public Instant getLastUsedAt() { return lastUsedAt; }
    public Instant getCreatedAt() { return createdAt; }

    public void markUsed() {
        this.lastUsedAt = Instant.now();
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public enum Platform {
        IOS, ANDROID, WEB
    }
}
