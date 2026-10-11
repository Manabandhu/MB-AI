package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.UUID;

/** Public form of a rating: the score and comment, without who rated whom. */
public record RideRatingView(UUID id, int rating, String comment, Instant createdAt) {

    static RideRatingView of(RideRating rating) {
        return new RideRatingView(rating.getId(), rating.getRating(), rating.getComment(), rating.getCreatedAt());
    }
}
