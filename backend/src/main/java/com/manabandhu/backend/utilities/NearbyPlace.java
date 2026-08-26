package com.manabandhu.backend.utilities;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "nearby_places")
public class NearbyPlace {

    @Id
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(nullable = false, length = 400)
    private String address;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column
    private Double rating;

    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(length = 20)
    private String phone;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected NearbyPlace() {}

    NearbyPlace(String name, String category, String address, double latitude, double longitude, Double rating, Double distanceKm, String phone) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.category = category;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.rating = rating;
        this.distanceKm = distanceKm;
        this.phone = phone;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getAddress() { return address; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public Double getRating() { return rating; }
    public Double getDistanceKm() { return distanceKm; }
    public String getPhone() { return phone; }
    public Instant getCreatedAt() { return createdAt; }
}
