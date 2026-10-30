package com.manabandhu.backend.marketplace;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * A listing as members see it. The seller's user id is never included; {@code isMine} tells the client whether to
 * show owner actions, and buyers reach the seller through {@code POST /listings/{id}/contact}.
 */
public record ListingView(
        UUID id,
        ListingCategory category,
        String title,
        String description,
        BigDecimal price,
        String currency,
        String condition,
        String location,
        Boolean negotiable,
        String status,
        Instant createdAt,
        Instant updatedAt,
        boolean isMine,
        boolean savedByViewer,
        String coverImageUrl) {

    static ListingView of(Listing listing, boolean isMine, boolean saved, String coverImageUrl) {
        return new ListingView(listing.getId(), listing.getCategory(), listing.getTitle(), listing.getDescription(),
                listing.getPrice(), listing.getCurrency(), listing.getCondition(), listing.getLocation(),
                listing.getNegotiable(), listing.getStatus(), listing.getCreatedAt(), listing.getUpdatedAt(),
                isMine, saved, coverImageUrl);
    }
}
