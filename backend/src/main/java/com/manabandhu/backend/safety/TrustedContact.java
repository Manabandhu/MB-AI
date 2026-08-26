package com.manabandhu.backend.safety;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "trusted_contacts")
public class TrustedContact {

    @Id
    private UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false)
    private UUID ownerId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 20)
    private String phone;

    @Column(length = 200)
    private String email;

    @Column(length = 120)
    private String relationship;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected TrustedContact() {}

    TrustedContact(UUID ownerId, String name, String phone, String email, String relationship) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.relationship = relationship;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public String getRelationship() { return relationship; }
    public Instant getCreatedAt() { return createdAt; }
}
