package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "room_listings")
public class RoomListing {

    @Id
    UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false)
    UUID ownerId;

    @Column(nullable = false, length = 200)
    String title;

    @Column(length = 4000)
    String description;

    @Column(nullable = false, precision = 10, scale = 2)
    BigDecimal price;

    @Column(nullable = false, length = 50)
    String roomType;

    @Column(nullable = false, length = 20)
    String status;

    @Column(length = 200)
    String broadLocation;

    @Column(name = "exact_address", length = 4000)
    String exactAddress;

    @Column(precision = 10, scale = 6)
    BigDecimal latitude;

    @Column(precision = 11, scale = 6)
    BigDecimal longitude;

    @Column(name = "dietary_preference", length = 50)
    String dietaryPreference = "ANY";

    @Column(name = "gender_preference", length = 50)
    String genderPreference = "ANY";

    @Column(name = "bathroom_type", length = 50)
    String bathroomType = "SHARED";

    @Column(name = "utilities_included")
    Boolean utilitiesIncluded = false;

    @Column(name = "est_utility_monthly", precision = 10, scale = 2)
    BigDecimal estUtilityMonthly = BigDecimal.ZERO;

    @Column(name = "security_deposit", precision = 10, scale = 2)
    BigDecimal securityDeposit = BigDecimal.ZERO;

    @Column(name = "lease_term", length = 50)
    String leaseTerm = "FLEXIBLE";

    @Column(name = "is_verified_host")
    Boolean isVerifiedHost = false;

    @Column(name = "university_shuttle_accessible")
    Boolean universityShuttleAccessible = false;

    @Column(name = "state_code", length = 50)
    String stateCode;

    @Column(length = 100)
    String county;

    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    protected RoomListing() {}

    RoomListing(UUID ownerId, String title, String description, BigDecimal price, String roomType, String status,
                String broadLocation, String exactAddress, BigDecimal latitude, BigDecimal longitude) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.title = title;
        this.description = description;
        this.price = price;
        this.roomType = roomType;
        this.status = status;
        this.broadLocation = broadLocation;
        this.exactAddress = exactAddress;
        this.latitude = latitude;
        this.longitude = longitude;
        this.dietaryPreference = "ANY";
        this.genderPreference = "ANY";
        this.bathroomType = "SHARED";
        this.utilitiesIncluded = false;
        this.estUtilityMonthly = BigDecimal.ZERO;
        this.securityDeposit = BigDecimal.ZERO;
        this.leaseTerm = "FLEXIBLE";
        this.isVerifiedHost = false;
        this.universityShuttleAccessible = false;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public BigDecimal getPrice() { return price; }
    public String getRoomType() { return roomType; }
    public String getStatus() { return status; }
    public String getBroadLocation() { return broadLocation; }
    public String getExactAddress() { return exactAddress; }
    public BigDecimal getLatitude() { return latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public String getDietaryPreference() { return dietaryPreference; }
    public String getGenderPreference() { return genderPreference; }
    public String getBathroomType() { return bathroomType; }
    public Boolean getUtilitiesIncluded() { return utilitiesIncluded; }
    public BigDecimal getEstUtilityMonthly() { return estUtilityMonthly; }
    public BigDecimal getSecurityDeposit() { return securityDeposit; }
    public String getLeaseTerm() { return leaseTerm; }
    public Boolean getIsVerifiedHost() { return isVerifiedHost; }
    public Boolean getUniversityShuttleAccessible() { return universityShuttleAccessible; }
    public String getStateCode() { return stateCode; }
    public String getCounty() { return county; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    void setTitle(String title) { this.title = title; }
    void setDescription(String description) { this.description = description; }
    void setPrice(BigDecimal price) { this.price = price; }
    void setRoomType(String roomType) { this.roomType = roomType; }
    void setBroadLocation(String broadLocation) { this.broadLocation = broadLocation; }
    void setExactAddress(String exactAddress) { this.exactAddress = exactAddress; }
    void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    void setStatus(String status) { this.status = status; }
    void setDietaryPreference(String dietaryPreference) { this.dietaryPreference = dietaryPreference; }
    void setGenderPreference(String genderPreference) { this.genderPreference = genderPreference; }
    void setBathroomType(String bathroomType) { this.bathroomType = bathroomType; }
    void setUtilitiesIncluded(Boolean utilitiesIncluded) { this.utilitiesIncluded = utilitiesIncluded; }
    void setEstUtilityMonthly(BigDecimal estUtilityMonthly) { this.estUtilityMonthly = estUtilityMonthly; }
    void setSecurityDeposit(BigDecimal securityDeposit) { this.securityDeposit = securityDeposit; }
    void setLeaseTerm(String leaseTerm) { this.leaseTerm = leaseTerm; }
    void setIsVerifiedHost(Boolean isVerifiedHost) { this.isVerifiedHost = isVerifiedHost; }
    void setUniversityShuttleAccessible(Boolean universityShuttleAccessible) { this.universityShuttleAccessible = universityShuttleAccessible; }
    void setStateCode(String stateCode) { this.stateCode = stateCode; }
    void setCounty(String county) { this.county = county; }
    void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
