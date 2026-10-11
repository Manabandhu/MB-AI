package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Public listing response. Deliberately excludes the exact address and the owner's user id, and rounds the
 * coordinates to about a kilometre so the address cannot be recovered from them. The owner sees the exact values
 * through {@link OwnerRoomListingResponse}; {@code isOwner} tells the client whether to show owner actions.
 */
public record RoomListingResponse(
        UUID id,
        String title,
        String description,
        BigDecimal price,
        String roomType,
        String status,
        String broadLocation,
        BigDecimal latitude,
        BigDecimal longitude,
        Instant createdAt,
        Instant updatedAt,
        List<String> amenities,
        List<String> preferences,
        boolean savedByViewer,
        boolean isOwner,
        String coverImageUrl,
        String dietaryPreference,
        String genderPreference,
        String bathroomType,
        Boolean utilitiesIncluded,
        BigDecimal estUtilityMonthly,
        BigDecimal securityDeposit,
        String leaseTerm,
        Boolean isVerifiedHost,
        Boolean universityShuttleAccessible,
        String stateCode,
        String county) {

    /** Two decimals of latitude/longitude is roughly 1 km: enough for a map pin, not enough for an address. */
    static BigDecimal approximate(BigDecimal coordinate) {
        return coordinate == null ? null : coordinate.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    public static RoomListingResponse from(RoomListing listing, List<String> amenities,
            List<String> preferences, boolean savedByViewer, boolean isOwner, String coverImageUrl) {
        return new RoomListingResponse(
                listing.getId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getPrice(),
                listing.getRoomType(),
                listing.getStatus(),
                listing.getBroadLocation(),
                approximate(listing.getLatitude()),
                approximate(listing.getLongitude()),
                listing.getCreatedAt(),
                listing.getUpdatedAt(),
                amenities,
                preferences,
                savedByViewer,
                isOwner,
                coverImageUrl,
                listing.getDietaryPreference(),
                listing.getGenderPreference(),
                listing.getBathroomType(),
                listing.getUtilitiesIncluded(),
                listing.getEstUtilityMonthly(),
                listing.getSecurityDeposit(),
                listing.getLeaseTerm(),
                listing.getIsVerifiedHost(),
                listing.getUniversityShuttleAccessible(),
                listing.getStateCode(),
                listing.getCounty());
    }
}
