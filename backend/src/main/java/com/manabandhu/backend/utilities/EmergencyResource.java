package com.manabandhu.backend.utilities;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "emergency_resources")
public class EmergencyResource {

    @Id
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(nullable = false, length = 400)
    private String address;

    @Column(length = 20)
    private String phone;

    @Column(length = 120)
    private String hours;

    @Column(nullable = false, length = 4000)
    private String description;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected EmergencyResource() {}

    EmergencyResource(String name, String category, String address, String phone, String hours, String description, double latitude, double longitude) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.category = category;
        this.address = address;
        this.phone = phone;
        this.hours = hours;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getAddress() { return address; }
    public String getPhone() { return phone; }
    public String getHours() { return hours; }
    public String getDescription() { return description; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public Instant getCreatedAt() { return createdAt; }
}
