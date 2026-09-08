package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ride_offers")
public class RideOffer {

    @Id
    private UUID id;

    @Column(name = "driver_id", nullable = false, updatable = false)
    private UUID driverId;

    @Column(name = "origin_area", nullable = false, length = 200)
    String originArea;

    @Column(name = "destination_area", nullable = false, length = 200)
    String destinationArea;

    @Column(name = "departure_at", nullable = false)
    Instant departureAt;

    @Column(name = "seats_total", nullable = false)
    int seatsTotal;

    @Column(name = "seats_available", nullable = false)
    int seatsAvailable;

    @Column(nullable = false, length = 200)
    String contribution;

    @Column(nullable = false, length = 20)
    String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    @Column(name = "reported", nullable = false)
    boolean reported;

    protected RideOffer() {}

    RideOffer(UUID driverId, String originArea, String destinationArea, Instant departureAt, int seatsTotal,
              int seatsAvailable, String contribution, String status) {
        this.id = UUID.randomUUID();
        this.driverId = driverId;
        this.originArea = originArea;
        this.destinationArea = destinationArea;
        this.departureAt = departureAt;
        this.seatsTotal = seatsTotal;
        this.seatsAvailable = seatsAvailable;
        this.contribution = contribution;
        this.status = status;
        this.reported = false;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getDriverId() { return driverId; }
    public String getOriginArea() { return originArea; }
    public String getDestinationArea() { return destinationArea; }
    public Instant getDepartureAt() { return departureAt; }
    public int getSeatsTotal() { return seatsTotal; }
    public int getSeatsAvailable() { return seatsAvailable; }
    public String getContribution() { return contribution; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public boolean isReported() { return reported; }
    void setReported(boolean reported) { this.reported = reported; }

    void setOriginArea(String originArea) { this.originArea = originArea; }
    void setDestinationArea(String destinationArea) { this.destinationArea = destinationArea; }
    void setDepartureAt(Instant departureAt) { this.departureAt = departureAt; }
    void setSeatsTotal(int seatsTotal) { this.seatsTotal = seatsTotal; }
    void setSeatsAvailable(int seatsAvailable) { this.seatsAvailable = seatsAvailable; }
    void setContribution(String contribution) { this.contribution = contribution; }
    void setStatus(String status) { this.status = status; }
    void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
