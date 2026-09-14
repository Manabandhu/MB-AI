package com.manabandhu.backend.rides;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UpdateRideOfferInput(
        @Size(max = 200) String originArea,
        @Size(max = 200) String destinationArea,
        @Future Instant departureAt,
        @Positive Integer seatsTotal,
        @Positive Integer seatsAvailable,
        @Size(max = 200) String contribution,
        @Size(max = 30) String status,
        Double originLat,
        Double originLng,
        Double destinationLat,
        Double destinationLng,
        String routePolyline,
        BigDecimal distanceMiles,
        Integer estimatedDurationMins,
        String tollPreference,
        BigDecimal estimatedTollAmount,
        Boolean isRecurring,
        String recurrencePattern,
        String[] recurringDays,
        String luggageCapacity,
        String genderPreference,
        Instant completedAt,
        UUID conversationId,
        Instant chatExpiresAt) {

    public UpdateRideOfferInput(String originArea, String destinationArea, Instant departureAt,
                                Integer seatsTotal, Integer seatsAvailable, String contribution, String status) {
        this(originArea, destinationArea, departureAt, seatsTotal, seatsAvailable, contribution, status,
                null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    }
}
