package com.manabandhu.backend.rides;

import java.math.BigDecimal;
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

    @Column(name = "origin_lat")
    Double originLat;

    @Column(name = "origin_lng")
    Double originLng;

    @Column(name = "destination_lat")
    Double destinationLat;

    @Column(name = "destination_lng")
    Double destinationLng;

    @Column(name = "route_polyline", columnDefinition = "TEXT")
    String routePolyline;

    @Column(name = "distance_miles", precision = 6, scale = 2)
    BigDecimal distanceMiles;

    @Column(name = "estimated_duration_mins")
    Integer estimatedDurationMins;

    @Column(name = "toll_preference", length = 30)
    String tollPreference;

    @Column(name = "estimated_toll_amount", precision = 6, scale = 2)
    BigDecimal estimatedTollAmount;

    @Column(name = "is_recurring")
    Boolean isRecurring;

    @Column(name = "recurrence_pattern", length = 30)
    String recurrencePattern;

    @Column(name = "recurring_days")
    String[] recurringDays;

    @Column(name = "luggage_capacity", length = 30)
    String luggageCapacity;

    @Column(name = "gender_preference", length = 30)
    String genderPreference;

    @Column(name = "completed_at")
    Instant completedAt;

    @Column(name = "conversation_id")
    UUID conversationId;

    @Column(name = "chat_expires_at")
    Instant chatExpiresAt;

    @Column(name = "departure_at", nullable = false)
    Instant departureAt;

    @Column(name = "seats_total", nullable = false)
    int seatsTotal;

    @Column(name = "seats_available", nullable = false)
    int seatsAvailable;

    @Column(nullable = false, length = 200)
    String contribution;

    @Column(nullable = false, length = 30)
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
        this.tollPreference = "AVOID_TOLLS";
        this.estimatedTollAmount = BigDecimal.ZERO;
        this.isRecurring = false;
        this.recurrencePattern = "ONE_TIME";
        this.recurringDays = new String[]{};
        this.luggageCapacity = "MEDIUM";
        this.genderPreference = "ANY";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getDriverId() { return driverId; }
    public String getOriginArea() { return originArea; }
    public String getDestinationArea() { return destinationArea; }
    public Double getOriginLat() { return originLat; }
    public Double getOriginLng() { return originLng; }
    public Double getDestinationLat() { return destinationLat; }
    public Double getDestinationLng() { return destinationLng; }
    public String getRoutePolyline() { return routePolyline; }
    public BigDecimal getDistanceMiles() { return distanceMiles; }
    public Integer getEstimatedDurationMins() { return estimatedDurationMins; }
    public String getTollPreference() { return tollPreference; }
    public BigDecimal getEstimatedTollAmount() { return estimatedTollAmount; }
    public Boolean getIsRecurring() { return isRecurring; }
    public String getRecurrencePattern() { return recurrencePattern; }
    public String[] getRecurringDays() { return recurringDays; }
    public String getLuggageCapacity() { return luggageCapacity; }
    public String getGenderPreference() { return genderPreference; }
    public Instant getCompletedAt() { return completedAt; }
    public UUID getConversationId() { return conversationId; }
    public Instant getChatExpiresAt() { return chatExpiresAt; }
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
    void setOriginLat(Double originLat) { this.originLat = originLat; }
    void setOriginLng(Double originLng) { this.originLng = originLng; }
    void setDestinationLat(Double destinationLat) { this.destinationLat = destinationLat; }
    void setDestinationLng(Double destinationLng) { this.destinationLng = destinationLng; }
    void setRoutePolyline(String routePolyline) { this.routePolyline = routePolyline; }
    void setDistanceMiles(BigDecimal distanceMiles) { this.distanceMiles = distanceMiles; }
    void setEstimatedDurationMins(Integer estimatedDurationMins) { this.estimatedDurationMins = estimatedDurationMins; }
    void setTollPreference(String tollPreference) { this.tollPreference = tollPreference; }
    void setEstimatedTollAmount(BigDecimal estimatedTollAmount) { this.estimatedTollAmount = estimatedTollAmount; }
    void setIsRecurring(Boolean isRecurring) { this.isRecurring = isRecurring; }
    void setRecurrencePattern(String recurrencePattern) { this.recurrencePattern = recurrencePattern; }
    void setRecurringDays(String[] recurringDays) { this.recurringDays = recurringDays; }
    void setLuggageCapacity(String luggageCapacity) { this.luggageCapacity = luggageCapacity; }
    void setGenderPreference(String genderPreference) { this.genderPreference = genderPreference; }
    void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    void setConversationId(UUID conversationId) { this.conversationId = conversationId; }
    void setChatExpiresAt(Instant chatExpiresAt) { this.chatExpiresAt = chatExpiresAt; }
    void setDepartureAt(Instant departureAt) { this.departureAt = departureAt; }
    void setSeatsTotal(int seatsTotal) { this.seatsTotal = seatsTotal; }
    void setSeatsAvailable(int seatsAvailable) { this.seatsAvailable = seatsAvailable; }
    void setContribution(String contribution) { this.contribution = contribution; }
    void setStatus(String status) { this.status = status; }
    void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
