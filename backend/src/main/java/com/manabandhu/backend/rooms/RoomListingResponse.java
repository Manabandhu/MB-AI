package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Public listing response. Deliberately excludes the exact address, which is never
 * returned through public APIs. The exact address is only available to the listing
 * owner through {@link OwnerRoomListingResponse}.
 */
public record RoomListingResponse(
        UUID id,
        UUID ownerId,
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
        boolean savedByViewer) {

    public static RoomListingResponse from(RoomListing listing, List<String> amenities,
            List<String> preferences, boolean savedByViewer) {
        return new RoomListingResponse(
                listing.getId(),
                listing.getOwnerId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getPrice(),
                listing.getRoomType(),
                listing.getStatus(),
                listing.getBroadLocation(),
                listing.getLatitude(),
                listing.getLongitude(),
                listing.getCreatedAt(),
                listing.getUpdatedAt(),
                amenities,
                preferences,
                savedByViewer);
    }
}
