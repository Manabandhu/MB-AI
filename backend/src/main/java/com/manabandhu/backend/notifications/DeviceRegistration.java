package com.manabandhu.backend.notifications;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A push token for one device. The token moves to whoever signed in on that device most recently. */
@Entity
@Table(name = "device_registrations")
public class DeviceRegistration {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "device_token", nullable = false, length = 200)
    private String deviceToken;

    @Column(nullable = false, length = 20)
    private String platform;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected DeviceRegistration() {}

    DeviceRegistration(UUID userId, String deviceToken, String platform) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.deviceToken = deviceToken;
        this.platform = platform;
        this.enabled = true;
        this.createdAt = Instant.now();
        this.lastUsedAt = createdAt;
    }

    void assignTo(UUID userId, String platform) {
        this.userId = userId;
        this.platform = platform;
        this.enabled = true;
        this.lastUsedAt = Instant.now();
    }

    void disable() {
        this.enabled = false;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getDeviceToken() { return deviceToken; }
    public String getPlatform() { return platform; }
    public boolean isEnabled() { return enabled; }
    public Instant getLastUsedAt() { return lastUsedAt; }
}
