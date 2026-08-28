package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Owner-facing listing response that includes the exact address and private state.
 * Only the listing owner (or authorized admin/moderator) receives this representation.
 */
public record OwnerRoomListingResponse(
        UUID id,
        UUID ownerId,
        String title,
        String description,
        BigDecimal price,
        String roomType,
        String status,
        String broadLocation,
        String exactAddress,
        BigDecimal latitude,
        BigDecimal longitude,
        Instant createdAt,
        Instant updatedAt,
        List<String> amenities,
        List<String> preferences) {

    public static OwnerRoomListingResponse from(RoomListing listing, List<String> amenities,
            List<String> preferences) {
        return new OwnerRoomListingResponse(
                listing.getId(),
                listing.getOwnerId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getPrice(),
                listing.getRoomType(),
                listing.getStatus(),
                listing.getBroadLocation(),
                listing.getExactAddress(),
                listing.getLatitude(),
                listing.getLongitude(),
                listing.getCreatedAt(),
                listing.getUpdatedAt(),
                amenities,
                preferences);
    }
}
